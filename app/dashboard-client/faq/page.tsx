'use client'

import {
  HelpCircle,
  TrendingUp,
  Target,
  Shield,
  Building2,
  Lightbulb
} from 'lucide-react'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion'

export default function ClientFAQPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center mb-2">
          <HelpCircle className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Questions & Answers</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Common questions about your booking data and what it all means
        </p>
      </div>

      {/* FAQ Accordion */}
      <Accordion type="single" className="space-y-4">
        {/* Question 1: Attribution */}
        <AccordionItem value="item-1" className="bg-white border-gray-200">
          <AccordionTrigger value="item-1">
            <div className="flex items-center">
              <Target className="h-6 w-6 text-amber-600 mr-3 flex-shrink-0" />
              <span className="text-lg font-semibold text-gray-900">
                Why can't you tell me exactly which bookings came from ads?
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent value="item-1">
            <div className="space-y-4 text-base leading-relaxed">
              <p>
                Marketing attribution is one of the hardest problems in digital marketing. Here's why:
                A potential guest might see your Google ad on Monday, check reviews on Tuesday, look at
                your Instagram on Wednesday, and then book directly through your website on Friday.
                Which channel gets the credit? The truth is, they all played a role.
              </p>
              <p>
                Most booking platforms (like Booking.com) don't share detailed conversion data with you.
                Google and Meta tell us about clicks and some conversions, but they can't always track
                the final booking if it happens days later or on a different device. This is a limitation
                of the entire industry, not just our platform.
              </p>
              <p className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <strong>What we do instead:</strong> We show you overall trends and performance metrics.
                If you're spending R5,000/month on ads and your direct bookings are increasing while your
                spend stays consistent, that's a good sign your marketing is working - even if we can't
                point to individual bookings.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Question 2: Marketing Working */}
        <AccordionItem value="item-2" className="bg-white border-gray-200">
          <AccordionTrigger value="item-2">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-lg font-semibold text-gray-900">
                How do I know the marketing is working?
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent value="item-2">
            <div className="space-y-4 text-base leading-relaxed">
              <p>
                Look at the bigger picture over time. The key indicators that your marketing is working
                include: <strong>(1)</strong> Your direct booking percentage is increasing month over month,
                <strong>(2)</strong> Your total bookings are growing or staying stable while OTA bookings
                decrease, and <strong>(3)</strong> Your commission costs are going down as a percentage of
                total revenue.
              </p>
              <p>
                For example, if you started at 45% direct bookings three months ago and you're now at 67%
                (like in your current data), that's significant progress. Industry average is 50-60%, so
                you're already performing above average. This didn't happen by accident - your marketing
                efforts are shifting guests from OTAs to your direct channel.
              </p>
              <p className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <strong>Pro tip:</strong> Check your Progress page monthly. If you see your direct %
                trending upward over 3-6 months, your marketing is working. Don't judge success week by
                week - hospitality marketing takes time to compound.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Question 3: Good Direct Percentage */}
        <AccordionItem value="item-3" className="bg-white border-gray-200">
          <AccordionTrigger value="item-3">
            <div className="flex items-center">
              <Target className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" />
              <span className="text-lg font-semibold text-gray-900">
                What's a good direct booking percentage?
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent value="item-3">
            <div className="space-y-4 text-base leading-relaxed">
              <p>
                Industry benchmarks vary by property type and location, but here's a general guide:
              </p>
              <ul className="space-y-2 ml-6 list-disc">
                <li><strong>Below 40%:</strong> Heavily dependent on OTAs. Lots of room for improvement.</li>
                <li><strong>40-50%:</strong> Below average. You're leaving money on the table in commissions.</li>
                <li><strong>50-60%:</strong> Industry average. You're doing okay, but can do better.</li>
                <li><strong>60-70%:</strong> Above average. Strong direct booking presence.</li>
                <li><strong>70%+:</strong> Excellent! You're maximizing your revenue and minimizing commissions.</li>
              </ul>
              <p>
                Your current performance shows you're at <strong>67% direct bookings</strong>, which puts
                you in the "above average" range. This means for every 10 bookings, about 7 come directly
                to you (no commission) and 3 come through OTAs (15-20% commission). You're doing great!
              </p>
              <p className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <strong>Reality check:</strong> Very few hotels achieve 90%+ direct bookings. OTAs serve
                a purpose (more on that below). Aim for 70% as a realistic, excellent target.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Question 4: Reduce OTA Dependency */}
        <AccordionItem value="item-4" className="bg-white border-gray-200">
          <AccordionTrigger value="item-4">
            <div className="flex items-center">
              <Lightbulb className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0" />
              <span className="text-lg font-semibold text-gray-900">
                Can I reduce OTA dependency further?
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent value="item-4">
            <div className="space-y-4 text-base leading-relaxed">
              <p>
                Yes! Here are proven strategies to shift more bookings to your direct channel:
              </p>
              <ul className="space-y-3 ml-6">
                <li>
                  <strong>💰 Offer direct booking incentives:</strong> "Book direct and save 10%" or
                  "Free breakfast when you book on our website" gives guests a reason to skip OTAs.
                </li>
                <li>
                  <strong>🌐 Improve your website:</strong> Make sure your booking process is as easy
                  (or easier) than Booking.com. Mobile-friendly, fast, and simple.
                </li>
                <li>
                  <strong>📧 Email marketing:</strong> Build a guest database and send targeted offers
                  to past guests. They already know you - remind them to book direct next time.
                </li>
                <li>
                  <strong>📱 Invest in Google Ads:</strong> Bid on your own hotel name so when people
                  search for you, your website appears first, not an OTA.
                </li>
                <li>
                  <strong>⭐ Encourage reviews on Google:</strong> Great Google reviews build trust
                  and make guests more likely to book directly with you.
                </li>
              </ul>
              <p className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <strong>Start small:</strong> Pick one strategy and do it well. For example, if you don't
                have a direct booking incentive, start there. It's the easiest and fastest win.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Question 5: Why Still Need OTAs */}
        <AccordionItem value="item-5" className="bg-white border-gray-200">
          <AccordionTrigger value="item-5">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-purple-600 mr-3 flex-shrink-0" />
              <span className="text-lg font-semibold text-gray-900">
                Why do I still need OTAs if direct is better?
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent value="item-5">
            <div className="space-y-4 text-base leading-relaxed">
              <p>
                Great question! While direct bookings are more profitable, OTAs still serve important purposes:
              </p>
              <p>
                <strong>1. Discovery and reach:</strong> OTAs like Booking.com and Airbnb spend millions
                on advertising. When travelers don't know about your property yet, OTAs help them find you.
                Think of OTAs as a marketing channel that you only pay for when it works (performance-based
                advertising).
              </p>
              <p>
                <strong>2. Trust and convenience:</strong> Some guests simply prefer booking through OTAs
                because they trust the platform, like the loyalty points, or prefer the OTA's cancellation
                policies. Fighting this is like fighting the tide - better to work with it.
              </p>
              <p>
                <strong>3. Filling gaps:</strong> During slow periods, OTAs can help fill rooms you might
                otherwise leave empty. Yes, you pay commission, but some revenue is better than no revenue.
              </p>
              <p className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded">
                <strong>The balanced approach:</strong> Use OTAs for discovery and filling gaps, but focus
                your marketing on converting guests to direct bookers. A 70/30 split (70% direct, 30% OTA)
                is a healthy, sustainable balance for most properties.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Question 6: What to Focus On */}
        <AccordionItem value="item-6" className="bg-white border-gray-200">
          <AccordionTrigger value="item-6">
            <div className="flex items-center">
              <Building2 className="h-6 w-6 text-indigo-600 mr-3 flex-shrink-0" />
              <span className="text-lg font-semibold text-gray-900">
                What should I focus on as the hotel owner?
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent value="item-6">
            <div className="space-y-4 text-base leading-relaxed">
              <p>
                Your time is valuable, so focus on what actually moves the needle:
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200 p-5 rounded-lg space-y-3">
                <div className="flex items-start">
                  <div className="text-2xl mr-3">1️⃣</div>
                  <div>
                    <strong className="text-indigo-900">Guest experience first:</strong>
                    <p className="text-gray-700 mt-1">
                      Happy guests leave great reviews, come back, and book directly. This is your foundation.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-2xl mr-3">2️⃣</div>
                  <div>
                    <strong className="text-indigo-900">Watch the trends, not the details:</strong>
                    <p className="text-gray-700 mt-1">
                      Check your dashboard once a month. Look at the big picture: Is direct % going up?
                      Are commissions going down? Is revenue growing? That's all you need to know.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-2xl mr-3">3️⃣</div>
                  <div>
                    <strong className="text-indigo-900">Invest in your website:</strong>
                    <p className="text-gray-700 mt-1">
                      Make sure it's fast, mobile-friendly, and easy to book. If your website looks
                      worse than Booking.com, guests will use Booking.com.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-2xl mr-3">4️⃣</div>
                  <div>
                    <strong className="text-indigo-900">Build your email list:</strong>
                    <p className="text-gray-700 mt-1">
                      Every guest who stays is a potential repeat customer. Capture their email and
                      send occasional offers. Past guests are your best source of direct bookings.
                    </p>
                  </div>
                </div>
              </div>
              <p className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded">
                <strong>Bottom line:</strong> You're already at 67% direct bookings, which is excellent.
                Don't obsess over the data. Focus on delivering great experiences, and the direct bookings
                will continue to grow naturally. Use this dashboard to spot trends and celebrate progress,
                not to micromanage every booking.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Help Footer */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
        <div className="flex items-start">
          <HelpCircle className="h-6 w-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Still have questions?</h3>
            <p className="text-blue-800 leading-relaxed">
              We're here to help. If something in your dashboard doesn't make sense, or you want
              guidance on improving your direct booking rate, reach out to our support team. We love
              helping hotel owners succeed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
