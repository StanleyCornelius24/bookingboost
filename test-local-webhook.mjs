import fetch from 'node-fetch'

// The actual payload from Gravity Forms logs
const payload = {
  "id": "3234",
  "form_id": "1",
  "post_id": null,
  "date_created": "2026-02-06 13:37:20",
  "date_updated": "2026-02-06 13:37:20",
  "is_starred": "0",
  "is_read": "0",
  "ip": "197.215.165.169",
  "source_url": "https://www.turbinehotel.co.za/contact/",
  "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
  "currency": "USD",
  "payment_status": null,
  "payment_date": null,
  "payment_amount": null,
  "payment_method": null,
  "transaction_id": null,
  "is_fulfilled": null,
  "created_by": "1",
  "transaction_type": null,
  "status": "active",
  "source_id": "86",
  "1": "Stanley Cornelius",
  "3": "0610029259",
  "4": "stanley@focusonline.co.za",
  "12": "ZA",
  "5": "Standard",
  "6": "2026-02-21",
  "7": "2026-02-25",
  "8": "2",
  "9": "0",
  "10": "test",
  "submission_speeds": "{\"1\":[18326]}",
  "11": ""
}

console.log('Testing LOCAL webhook endpoint...\n')

try {
  const response = await fetch('http://localhost:3000/api/integrations/gravity-forms/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'bba_1e661d518ab4edfca55c6edfb60ef0ff',
      'X-Webhook-Signature': '5d1fa026db9a700b730f13ec449fdff2'
    },
    body: JSON.stringify(payload)
  })

  const result = await response.json()

  console.log('Status:', response.status)
  console.log('Response:', JSON.stringify(result, null, 2))

  if (response.status === 201) {
    console.log('\n✅ SUCCESS! Lead created')
  } else {
    console.log('\n❌ FAILED')
  }
} catch (error) {
  console.error('❌ Error:', error.message)
}
