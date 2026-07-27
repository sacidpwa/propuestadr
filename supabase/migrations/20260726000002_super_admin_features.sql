-- =====================================================
-- SUPER ADMIN FEATURES: Tasks, Access Logs, Goals, Messages
-- =====================================================

-- 1. TABLA DE TAREAS
CREATE TABLE IF NOT EXISTS admin_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  health_unit_id UUID REFERENCES health_units(id),
  priority TEXT DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE HISTORIAL DE ACCESOS
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  page TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE METAS
CREATE TABLE IF NOT EXISTS admin_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  health_unit_id UUID REFERENCES health_units(id),
  goal_type TEXT DEFAULT 'numerico' CHECK (goal_type IN ('numerico', 'porcentaje', 'tarea', 'booleano')),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  period_start DATE,
  period_end DATE,
  status TEXT DEFAULT 'activa' CHECK (status IN ('activa', 'completada', 'vencida', 'cancelada')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE MENSAJERÍA INTERNA
CREATE TABLE IF NOT EXISTS admin_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  parent_id UUID REFERENCES admin_messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VISTA DE USUARIOS CON ROLES (para el dashboard)
CREATE OR REPLACE VIEW user_profiles_with_roles AS
SELECT
  u.id AS user_id,
  u.email,
  COALESCE(p.full_name, u.email) AS full_name,
  COALESCE(ur.roles, ARRAY[]::app_role[]) AS roles,
  u.last_sign_in_at,
  u.created_at AS user_created_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN (
  SELECT user_id, ARRAY_AGG(role) AS roles
  FROM user_roles
  GROUP BY user_id
) ur ON ur.user_id = u.id;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_admin_tasks_assigned_to ON admin_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_assigned_by ON admin_tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_status ON admin_tasks(status);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_goals_assigned_to ON admin_goals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_admin_messages_sender ON admin_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_receiver ON admin_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at ON admin_messages(created_at);

-- RLS POLICIES
ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access on tasks" ON admin_tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access on access_logs" ON access_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access on goals" ON admin_goals FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full access on messages" ON admin_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can see their own tasks
CREATE POLICY "Users see own tasks" ON admin_tasks FOR SELECT
  USING (assigned_to = auth.uid());

-- Users can update status of their own tasks
CREATE POLICY "Users update own task status" ON admin_tasks FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Users can see their own access logs
CREATE POLICY "Users see own access logs" ON access_logs FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own access logs
CREATE POLICY "Users insert own access logs" ON access_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can see their own goals
CREATE POLICY "Users see own goals" ON admin_goals FOR SELECT
  USING (assigned_to = auth.uid());

-- Users can update their own goal progress
CREATE POLICY "Users update own goal progress" ON admin_goals FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Users can see messages they sent or received
CREATE POLICY "Users see own messages" ON admin_messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Users can send messages
CREATE POLICY "Users can send messages" ON admin_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Users can mark their received messages as read
CREATE POLICY "Users mark own received messages read" ON admin_messages FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());
