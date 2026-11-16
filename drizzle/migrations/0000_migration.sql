
CREATE TYPE public.app_role AS ENUM ('admin','mentor','client');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text, display_name text,
  mentor_requested boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.user_roles TO authenticated;
GRANT ALL ON public.profiles, public.user_roles TO service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.mentor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL, client_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mentor_id, client_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_assignments TO authenticated;
GRANT ALL ON public.mentor_assignments TO service_role;

CREATE OR REPLACE FUNCTION public.is_mentor_of(_mentor uuid, _client uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.mentor_assignments WHERE mentor_id = _mentor AND client_id = _client)
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_own_select ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin') OR public.is_mentor_of(auth.uid(), id));
CREATE POLICY profiles_own_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_own_update ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY roles_select ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY roles_admin_insert ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY roles_admin_delete ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.mentor_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY ma_select ON public.mentor_assignments FOR SELECT TO authenticated USING (auth.uid() IN (mentor_id, client_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY ma_insert ON public.mentor_assignments FOR INSERT TO authenticated WITH CHECK ((auth.uid() = mentor_id AND public.has_role(auth.uid(),'mentor')) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY ma_delete ON public.mentor_assignments FOR DELETE TO authenticated USING (auth.uid() = mentor_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, mentor_requested)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    COALESCE((NEW.raw_user_meta_data->>'mentor_requested')::boolean, false))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.app_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  scanner_enabled boolean NOT NULL DEFAULT true,
  daily_scan_limit integer NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_read ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY settings_admin_update ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
INSERT INTO public.app_settings (id) VALUES (1);

CREATE TABLE public.trading_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  platform text NOT NULL DEFAULT 'MT5', account_login text NOT NULL, broker_server text NOT NULL,
  label text, connection_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  strategy text NOT NULL DEFAULT 'trend', status text NOT NULL DEFAULT 'stopped',
  trading_mode text NOT NULL DEFAULT 'demo', demo_only boolean NOT NULL DEFAULT true,
  default_lot numeric NOT NULL DEFAULT 0.01, max_lot numeric NOT NULL DEFAULT 0.1,
  max_daily_loss numeric NOT NULL DEFAULT 0, max_open_trades integer NOT NULL DEFAULT 2 CHECK (max_open_trades >= 2),
  risk_per_trade_pct numeric NOT NULL DEFAULT 1 CHECK (risk_per_trade_pct > 0 AND risk_per_trade_pct <= 50),
  bridge_token_hash text, terminal_info jsonb, last_heartbeat timestamptz, last_decision text, last_error text,
  live_confirmed_at timestamptz, stop_requested_at timestamptz, stop_ack_at timestamptz,
  emergency_close_requested_at timestamptz, emergency_close_ack_at timestamptz, emergency_close_result text,
  profit_goal numeric NOT NULL DEFAULT 0 CHECK (profit_goal >= 0),
  profit_goal_mode text NOT NULL DEFAULT 'stop' CHECK (profit_goal_mode IN ('stop','again')),
  goal_started_at timestamptz, goal_reached_at timestamptz, goal_close_requested_at timestamptz,
  goal_close_ack_at timestamptz, goal_profit numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.trade_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  bot_id uuid NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  symbol text NOT NULL, side text NOT NULL, volume numeric NOT NULL,
  stop_loss numeric, take_profit numeric, strategy text, signal_key text, comment text,
  status text NOT NULL DEFAULT 'pending', ticket text, fill_price numeric, filled_at timestamptz,
  close_price numeric, closed_at timestamptz, profit numeric, error text, sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  instrument text NOT NULL, timeframe text NOT NULL, trading_style text NOT NULL,
  image_path text, analysis jsonb, status text NOT NULL DEFAULT 'pending', error text,
  saved boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  instrument text NOT NULL, note text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.backtest_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  symbol text NOT NULL, timeframe text NOT NULL, strategy text NOT NULL,
  bar_count integer NOT NULL DEFAULT 0, first_bar timestamptz, last_bar timestamptz,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, sender_id uuid,
  title text NOT NULL, body text, read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  symbol text NOT NULL, timeframe text NOT NULL, strategy text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy','sell')),
  entry double precision NOT NULL, stop_loss double precision NOT NULL, take_profit double precision NOT NULL,
  risk_reward double precision NOT NULL, reason text NOT NULL, explanation text NOT NULL,
  signal_key text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  data_at timestamptz NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX signals_user_key_uq ON public.signals (user_id, signal_key);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trading_accounts, public.bots, public.trade_signals, public.scans, public.watchlist, public.backtest_runs, public.notifications, public.signals TO authenticated;
GRANT ALL ON public.trading_accounts, public.bots, public.trade_signals, public.scans, public.watchlist, public.backtest_runs, public.notifications, public.signals TO service_role;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['trading_accounts','bots','trade_signals','scans','watchlist','backtest_runs','signals'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),''admin'') OR public.is_mentor_of(auth.uid(), user_id))', t||'_select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t||'_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id)', t||'_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t||'_delete', t);
  END LOOP;
END $$;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notif_select ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = sender_id);
CREATE POLICY notif_insert ON public.notifications FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id OR (auth.uid() = sender_id AND (public.has_role(auth.uid(),'admin') OR public.is_mentor_of(auth.uid(), user_id))));
CREATE POLICY notif_update ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY notif_delete ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.mentor_bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mentor_id uuid NOT NULL,
  mentor_name text NOT NULL DEFAULT '', name text NOT NULL, description text NOT NULL DEFAULT '',
  strategies text NOT NULL DEFAULT '', avatar_url text, background_url text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.mentor_bot_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mentor_id uuid NOT NULL,
  bot_id uuid NOT NULL REFERENCES public.mentor_bots(id) ON DELETE CASCADE,
  client_name text NOT NULL, client_email text NOT NULL, client_id uuid,
  license_key text NOT NULL UNIQUE, license_hash text NOT NULL,
  status text NOT NULL DEFAULT 'issued', redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_bots, public.mentor_bot_licenses TO authenticated;
GRANT ALL ON public.mentor_bots, public.mentor_bot_licenses TO service_role;
ALTER TABLE public.mentor_bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY mb_select ON public.mentor_bots FOR SELECT TO authenticated USING (
  auth.uid() = mentor_id OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.mentor_bot_licenses l WHERE l.bot_id = mentor_bots.id AND l.client_id = auth.uid()));
CREATE POLICY mb_insert ON public.mentor_bots FOR INSERT TO authenticated WITH CHECK (auth.uid() = mentor_id AND public.has_role(auth.uid(),'mentor'));
CREATE POLICY mb_update ON public.mentor_bots FOR UPDATE TO authenticated USING (auth.uid() = mentor_id);
CREATE POLICY mb_delete ON public.mentor_bots FOR DELETE TO authenticated USING (auth.uid() = mentor_id);
ALTER TABLE public.mentor_bot_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY mbl_select ON public.mentor_bot_licenses FOR SELECT TO authenticated USING (auth.uid() = mentor_id OR auth.uid() = client_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY mbl_update ON public.mentor_bot_licenses FOR UPDATE TO authenticated USING (auth.uid() = mentor_id);
CREATE POLICY mbl_delete ON public.mentor_bot_licenses FOR DELETE TO authenticated USING (auth.uid() = mentor_id);

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.issue_mentor_bot_license(p_license_key text, p_bot_id uuid, p_client_name text, p_client_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'mentor') THEN RAISE EXCEPTION 'Only mentors can issue licenses'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.mentor_bots WHERE id = p_bot_id AND mentor_id = auth.uid()) THEN
    RAISE EXCEPTION 'Robot not found'; END IF;
  INSERT INTO public.mentor_bot_licenses (mentor_id, bot_id, client_name, client_email, license_key, license_hash)
  VALUES (auth.uid(), p_bot_id, p_client_name, lower(p_client_email), upper(p_license_key),
          encode(extensions.digest(upper(p_license_key), 'sha256'), 'hex'));
END $$;

CREATE OR REPLACE FUNCTION public.redeem_mentor_bot_license(p_license_key text)
RETURNS TABLE (bot_id uuid, bot_name text, mentor_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l public.mentor_bot_licenses; v_email text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  SELECT * INTO l FROM public.mentor_bot_licenses WHERE license_key = upper(p_license_key);
  IF l.id IS NULL OR l.status = 'revoked' THEN RAISE EXCEPTION 'Invalid license key'; END IF;
  IF l.client_id IS NOT NULL AND l.client_id <> auth.uid() THEN RAISE EXCEPTION 'License already used'; END IF;
  IF l.client_id IS NULL AND lower(l.client_email) <> lower(coalesce(v_email,'')) THEN
    RAISE EXCEPTION 'This license was issued to a different email'; END IF;
  UPDATE public.mentor_bot_licenses SET client_id = auth.uid(), status = 'redeemed', redeemed_at = coalesce(redeemed_at, now()) WHERE id = l.id;
  INSERT INTO public.mentor_assignments (mentor_id, client_id) VALUES (l.mentor_id, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN QUERY SELECT b.id, b.name, b.mentor_name FROM public.mentor_bots b WHERE b.id = l.bot_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN jsonb_build_object(
    'users', (SELECT count(*) FROM public.profiles),
    'scans', (SELECT count(*) FROM public.scans),
    'scans_today', (SELECT count(*) FROM public.scans WHERE created_at >= date_trunc('day', now())),
    'mentor_requests', (SELECT count(*) FROM public.profiles WHERE mentor_requested),
    'accounts', (SELECT count(*) FROM public.trading_accounts));
END $$;

CREATE TABLE public.cloud_api_keys (
  user_id uuid PRIMARY KEY,
  api_key text NOT NULL CHECK (char_length(api_key) BETWEEN 16 AND 256),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cloud_api_keys TO service_role;
ALTER TABLE public.cloud_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY charts_own_rw ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'charts' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'charts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY mbm_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'mentor-bot-media');
CREATE POLICY mbm_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mentor-bot-media' AND (storage.foldername(name))[1] = auth.uid()::text);
