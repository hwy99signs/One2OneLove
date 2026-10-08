import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { motion } from 'framer-motion';

/**
 * Feature Gate Component
 * Blocks access to features based on subscription plan
 * 
 * Usage:
 * <FeatureGate feature="ai_coach_limited">
 *   <AICoachComponent />
 * </FeatureGate>
 */
export default function FeatureGate({ 
  feature, 
  children, 
  fallback = null,
  requiredPlan = 'Premiere',
  showUpgradePrompt = true 
}) {
  const { hasAccess, plan } = useFeatureAccess(feature);

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default: Show upgrade prompt
  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <Crown className="w-6 h-6 text-yellow-600" />
              Premium Feature
            </h3>
            
            <p className="text-gray-600 mb-2">
              This feature requires a <strong>{requiredPlan}</strong> subscription
            </p>
            
            <p className="text-sm text-gray-500 mb-6">
              You're currently on the <strong>{plan}</strong> plan
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={createPageUrl("Subscription")}>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to {requiredPlan}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              ✨ Unlock all premium features with a paid plan
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Inline Feature Lock Badge
 * Shows a small lock icon for locked features
 */
export function FeatureLockBadge({ feature, className = '' }) {
  const { hasAccess } = useFeatureAccess(feature);

  if (hasAccess) {
    return null;
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold text-purple-600 ${className}`}>
      <Lock className="w-3 h-3" />
      Premium
    </span>
  );
}

/**
 * Feature Access Message
 * Shows a message about feature access
 */
export function FeatureAccessMessage({ feature, requiredPlan = 'Premiere' }) {
  const { hasAccess, plan } = useFeatureAccess(feature);

  if (hasAccess) {
    return null;
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <Lock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            Upgrade Required
          </p>
          <p className="text-sm text-gray-600 mt-1">
            This feature requires a <strong>{requiredPlan}</strong> plan. 
            You're currently on <strong>{plan}</strong>.
          </p>
          <Link to={createPageUrl("Subscription")}>
            <Button size="sm" variant="outline" className="mt-2">
              View Plans
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

