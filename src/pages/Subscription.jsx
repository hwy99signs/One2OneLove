import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Sparkles, TrendingUp, CheckCircle, ArrowRight, CreditCard, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TierCard from '@/components/subscriptions/TierCard';
import { getUserSubscription, getPaymentHistory } from '@/lib/stripeService';
import { format } from 'date-fns';
import { toast } from 'sonner';

const tiers = [
  {
    name: 'Basis',
    tagline: 'Start Your Journey',
    price: 0,
    period: null,
    description: 'Perfect for couples just starting out',
    icon: '💝',
    gradient: 'from-blue-400 to-blue-600',
    features: [
      'Access to 50+ Love Notes Library',
      'Basic Relationship Quizzes',
      'Monthly Date Ideas (5 ideas)',
      'Anniversary Reminders',
      'Memory Timeline',
      'Mobile App Access',
      'Email Support',
    ],
    popular: false,
    isFree: true,
  },
  {
    name: 'Premiere',
    tagline: 'Most Popular',
    price: 19.99,
    period: 'month',
    description: 'For couples ready to grow together',
    icon: '💖',
    gradient: 'from-purple-400 to-pink-500',
    features: [
      'Everything in Basis, plus:',
      'Access to 1000+ Love Notes Library',
      'AI Relationship Coach (50 questions/month)',
      'Unlimited Date Ideas',
      'Relationship Goals Tracker',
      'Advanced Quizzes & Insights',
      'Surprise Message Scheduling',
      'Ad-Free Experience',
      'Priority Support',
      'Early Access to New Features',
    ],
    popular: true,
    priceId: import.meta.env.VITE_STRIPE_PRICE_PREMIERE || 'price_premiere', // Set in .env or Stripe Dashboard
  },
  {
    name: 'Exclusive',
    tagline: 'Ultimate Experience',
    price: 34.99,
    period: 'month',
    description: 'The complete relationship toolkit',
    icon: '👑',
    gradient: 'from-yellow-400 to-orange-500',
    features: [
      'Everything in Premiere, plus:',
      'Unlimited Love Notes Library',
      'Unlimited AI Relationship Coach',
      'AI-Powered Content Creator',
      'Personalized Relationship Reports',
      'Exclusive Community Access',
      '1-on-1 Expert Consultation',
      'Premium Support (24/7)',
      'VIP Badge & Perks',
      'Lifetime Access to Premium Content',
    ],
    popular: false,
    priceId: import.meta.env.VITE_STRIPE_PRICE_EXCLUSIVE || 'price_exclusive', // Set in .env or Stripe Dashboard
  },
];

export default function Subscription() {
  const { user } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSubscriptionData = async () => {
      try {
        const [subscription, payments] = await Promise.all([
          getUserSubscription(),
          getPaymentHistory(),
        ]);

        setCurrentSubscription(subscription);
        setPaymentHistory(payments);
      } catch (error) {
        console.error('Error loading subscription data:', error);
        toast.error('Failed to load subscription information');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const currentPlan = user?.subscription_plan || 'Basis';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">Choose Your Plan</h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">
            Unlock premium features to strengthen your relationship
          </p>
          <p className="text-sm text-gray-500">
            Currently on: <span className="font-bold text-purple-600">{currentPlan}</span> plan
          </p>
        </div>

        {/* Current Subscription Info */}
        {currentSubscription && currentSubscription.subscription_status === 'active' && currentPlan !== 'Basis' && (
          <Card className="mb-8 border-2 border-purple-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Your Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Plan</p>
                  <p className="text-lg font-bold text-gray-900">{currentSubscription.subscription_plan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className="text-lg font-bold text-green-600 capitalize">{currentSubscription.subscription_status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Renews On</p>
                  <p className="text-lg font-bold text-gray-900">
                    {currentSubscription.subscription_current_period_end
                      ? format(new Date(currentSubscription.subscription_current_period_end), 'MMM dd, yyyy')
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {currentSubscription.cancel_at_period_end && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Your subscription will be canceled at the end of the current billing period.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Subscription Tiers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier, index) => (
            <TierCard
              key={tier.name}
              tier={tier}
              index={index}
              isSelected={currentPlan === tier.name}
              showPayment={true}
            />
          ))}
        </div>

        {/* Payment History */}
        {paymentHistory && paymentHistory.length > 0 && (
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-600" />
                Payment History
              </CardTitle>
              <CardDescription>Your recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Plan</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id} className="border-b last:border-0">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {format(new Date(payment.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {payment.subscription_plan}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          ${payment.amount.toFixed(2)} {payment.currency.toUpperCase()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              payment.status === 'succeeded'
                                ? 'bg-green-100 text-green-800'
                                : payment.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {payment.status === 'succeeded' && <CheckCircle className="w-3 h-3" />}
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FAQ or Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Have questions about our plans?
          </p>
          <Button variant="outline" size="lg">
            Contact Support
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

