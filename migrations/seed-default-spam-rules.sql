-- =====================================================
-- DEFAULT SPAM DETECTION RULES - SEED DATA
-- =====================================================
-- Pre-populate spam_detection_rules with common spam patterns
-- All rules are global (hotel_id = NULL) and can be customized per hotel later

-- =====================================================
-- DISPOSABLE EMAIL DOMAINS (Blocking)
-- =====================================================
INSERT INTO spam_detection_rules (hotel_id, rule_name, rule_type, rule_value, spam_score_increment, is_blocking, enabled, description)
VALUES
  (NULL, 'Mailinator Domain', 'email_domain', 'mailinator.com', 1.0, true, true, 'Disposable email service - auto-block'),
  (NULL, '10 Minute Mail Domain', 'email_domain', '10minutemail.com', 1.0, true, true, 'Temporary email service - auto-block'),
  (NULL, 'Guerrilla Mail Domain', 'email_domain', 'guerrillamail.com', 1.0, true, true, 'Temporary email service - auto-block'),
  (NULL, 'TempMail Domain', 'email_domain', 'temp-mail.org', 1.0, true, true, 'Temporary email service - auto-block'),
  (NULL, 'ThrowAwayMail Domain', 'email_domain', 'throwawaymail.com', 1.0, true, true, 'Disposable email service - auto-block'),
  (NULL, 'Maildrop Domain', 'email_domain', 'maildrop.cc', 1.0, true, true, 'Temporary email service - auto-block'),
  (NULL, 'YopMail Domain', 'email_domain', 'yopmail.com', 1.0, true, true, 'Temporary email service - auto-block'),
  (NULL, 'FakeMail Domain', 'email_domain', 'fakemail.net', 1.0, true, true, 'Fake email service - auto-block'),
  (NULL, 'TrashMail Domain', 'email_domain', 'trashmail.com', 1.0, true, true, 'Temporary email service - auto-block'),
  (NULL, 'GetNada Domain', 'email_domain', 'getnada.com', 1.0, true, true, 'Temporary email service - auto-block');

-- =====================================================
-- SPAM KEYWORDS (High Score)
-- =====================================================
INSERT INTO spam_detection_rules (hotel_id, rule_name, rule_type, rule_value, spam_score_increment, is_blocking, enabled, description)
VALUES
  (NULL, 'Viagra Keyword', 'keyword', 'viagra', 0.8, false, true, 'Common spam keyword'),
  (NULL, 'Casino Keyword', 'keyword', 'casino', 0.8, false, true, 'Common spam keyword'),
  (NULL, 'Lottery Keyword', 'keyword', 'lottery', 0.8, false, true, 'Common spam keyword'),
  (NULL, 'Prize Keyword', 'keyword', 'won a prize', 0.7, false, true, 'Common spam phrase'),
  (NULL, 'Weight Loss Keyword', 'keyword', 'weight loss', 0.7, false, true, 'Common spam keyword'),
  (NULL, 'Free Money Keyword', 'keyword', 'free money', 0.8, false, true, 'Common spam phrase'),
  (NULL, 'Click Here Keyword', 'keyword', 'click here now', 0.6, false, true, 'Spam call-to-action'),
  (NULL, 'Act Now Keyword', 'keyword', 'act now', 0.5, false, true, 'Urgency spam phrase'),
  (NULL, 'Crypto Investment Keyword', 'keyword', 'crypto investment', 0.7, false, true, 'Investment spam'),
  (NULL, 'Make Money Fast Keyword', 'keyword', 'make money fast', 0.8, false, true, 'Get-rich-quick spam'),
  (NULL, 'SEO Services Spam', 'keyword', 'seo services', 0.6, false, true, 'Unsolicited SEO spam'),
  (NULL, 'Link Building Spam', 'keyword', 'link building', 0.6, false, true, 'Unsolicited marketing spam'),
  (NULL, 'Pharmaceutical Spam', 'keyword', 'buy pills', 0.8, false, true, 'Pharmaceutical spam'),
  (NULL, 'Loan Offer Spam', 'keyword', 'loan offer', 0.6, false, true, 'Financial spam');

-- =====================================================
-- MESSAGE QUALITY RULES
-- =====================================================
INSERT INTO spam_detection_rules (hotel_id, rule_name, rule_type, rule_value, spam_score_increment, is_blocking, enabled, description)
VALUES
  (NULL, 'Message Too Short', 'length', '20', 0.3, false, true, 'Messages under 20 characters are likely spam'),
  (NULL, 'Message Extremely Short', 'length', '10', 0.5, false, true, 'Messages under 10 characters are very likely spam');

-- =====================================================
-- PATTERN-BASED RULES
-- =====================================================
INSERT INTO spam_detection_rules (hotel_id, rule_name, rule_type, rule_value, spam_score_increment, is_blocking, enabled, description)
VALUES
  (NULL, 'All Caps Message', 'pattern', 'all_caps', 0.5, false, true, 'Messages in all capital letters'),
  (NULL, 'Excessive URLs', 'pattern', 'multiple_urls', 0.7, false, true, 'Messages with 3+ URLs are likely spam'),
  (NULL, 'No Spaces Pattern', 'pattern', 'no_spaces', 0.4, false, true, 'Messages without spaces are suspicious'),
  (NULL, 'Excessive Punctuation', 'pattern', 'excessive_punctuation', 0.3, false, true, 'Messages with excessive !!! or ???');

-- =====================================================
-- EMAIL PATTERN RULES
-- =====================================================
INSERT INTO spam_detection_rules (hotel_id, rule_name, rule_type, rule_value, spam_score_increment, is_blocking, enabled, description)
VALUES
  (NULL, 'Random Email Pattern', 'pattern', 'random_email', 0.4, false, true, 'Email addresses with random character sequences'),
  (NULL, 'No TLD Email', 'pattern', 'invalid_email', 0.6, false, true, 'Email addresses without valid TLD');

-- =====================================================
-- PHONE VALIDATION RULES
-- =====================================================
INSERT INTO spam_detection_rules (hotel_id, rule_name, rule_type, rule_value, spam_score_increment, is_blocking, enabled, description)
VALUES
  (NULL, 'Invalid Phone Format', 'pattern', 'invalid_phone', 0.4, false, true, 'Phone numbers with invalid format'),
  (NULL, 'Sequential Phone Numbers', 'pattern', 'sequential_phone', 0.5, false, true, 'Phone numbers like 1111111111 or 1234567890');

-- =====================================================
-- STATISTICS
-- =====================================================
-- Count total rules created
DO $$
DECLARE
  total_rules INTEGER;
  blocking_rules INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_rules FROM spam_detection_rules WHERE hotel_id IS NULL;
  SELECT COUNT(*) INTO blocking_rules FROM spam_detection_rules WHERE hotel_id IS NULL AND is_blocking = true;

  RAISE NOTICE 'Created % global spam detection rules', total_rules;
  RAISE NOTICE '% rules are auto-blocking', blocking_rules;
END $$;
