-- Create subscription plans table
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    duration TEXT NOT NULL CHECK (duration IN ('monthly', 'yearly')),
    features JSONB,
    product_id TEXT NOT NULL UNIQUE,
    is_popular BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user subscriptions table
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
    original_transaction_id TEXT NOT NULL,
    receipt_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, original_transaction_id)
);

-- Create subscription transactions table for audit trail
CREATE TABLE subscription_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'renewal', 'cancellation', 'refund')),
    amount DECIMAL(10,2),
    currency TEXT,
    transaction_id TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
    receipt_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_end_date ON user_subscriptions(end_date);
CREATE INDEX idx_subscription_transactions_user_id ON subscription_transactions(user_id);
CREATE INDEX idx_subscription_transactions_subscription_id ON subscription_transactions(subscription_id);

-- Create RLS policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;

-- Subscription plans are readable by all authenticated users
CREATE POLICY "Subscription plans are readable by authenticated users" ON subscription_plans
    FOR SELECT TO authenticated USING (active = true);

-- Users can only access their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Users can only access their own subscription transactions
CREATE POLICY "Users can view their own subscription transactions" ON subscription_transactions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription transactions" ON subscription_transactions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, currency, duration, features, product_id, is_popular)
VALUES 
    ('Premium Monthly', 'Access to all premium features', 9.99, 'USD', 'monthly', 
     '["Unlimited practice sessions", "Advanced tone recognition", "Personalized feedback", "Offline mode", "Progress tracking"]'::jsonb, 
     'com.yuyin.premium.monthly', false),
    ('Premium Yearly', 'Best value - Save 40%!', 59.99, 'USD', 'yearly', 
     '["All Monthly features", "Priority support", "Exclusive content", "Achievement badges"]'::jsonb, 
     'com.yuyin.premium.yearly', true);

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_subscriptions 
        WHERE user_subscriptions.user_id = $1 
        AND status = 'active' 
        AND end_date > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current subscription
CREATE OR REPLACE FUNCTION get_user_subscription(user_id UUID)
RETURNS TABLE (
    id UUID,
    plan_id TEXT,
    status TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN,
    platform TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.plan_id,
        us.status,
        us.start_date,
        us.end_date,
        us.auto_renew,
        us.platform
    FROM user_subscriptions us
    WHERE us.user_id = $1 
    AND us.status = 'active' 
    AND us.end_date > NOW()
    ORDER BY us.end_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 