require("dotenv").config()
const twilio = require("twilio")

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// ─── Format date properly ─────────────────────────────────────────────────────
const formatDate = (date) => {
  if (!date) return "your scheduled date"
  const d = new Date(date)
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  })
}

// ─── Format time properly ─────────────────────────────────────────────────────
const formatTime = (time) => {
  if (!time) return ""
  if (time.includes("AM") || time.includes("PM")) return time
  const [hourStr, minuteStr] = time.split(":")
  let hours = parseInt(hourStr)
  const minutes = minuteStr || "00"
  const modifier = hours >= 12 ? "PM" : "AM"
  if (hours === 0) hours = 12
  else if (hours > 12) hours -= 12
  return `${String(hours).padStart(2, "0")}:${minutes} ${modifier}`
}

// ─── Send SMS ─────────────────────────────────────────────────────────────────
const sendSMS = async (phone, message) => {
  // Skip if Twilio credentials not configured
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.log("⚠️ SMS skipped — Twilio not configured")
    return
  }
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: "+91" + phone
    })
    console.log("✅ SMS SENT:", result.sid)
    return result
  } catch (error) {
    // Log but never crash the app for SMS failures
    console.warn("⚠️ SMS failed (non-fatal):", error.message)
  }
}

// ─── Notification Messages ────────────────────────────────────────────────────
const notifyBookingCreated = (phone, name, bookingCode, activityName, amount) =>
  sendSMS(phone,
    `Dear ${name},\n\n` +
    `Your booking request has been received!\n\n` +
    `Activity: ${activityName}\n` +
    `Booking Code: ${bookingCode}\n` +
    `Amount: Rs.${Number(amount).toLocaleString("en-IN")}\n\n` +
    `We will notify you once the provider confirms.\n\n` +
    `Team GoaXplore`
  )

const notifyBookingConfirmed = (phone, name, bookingCode, activityName, date, time) =>
  sendSMS(phone,
    `Dear ${name},\n\n` +
    `Great news! Your booking is CONFIRMED.\n\n` +
    `Activity: ${activityName}\n` +
    `Booking Code: ${bookingCode}\n` +
    `Date: ${formatDate(date)}\n` +
    `Time: ${formatTime(time)}\n\n` +
    `Please show your Booking Code at the venue.\n\n` +
    `Team GoaXplore`
  )

const notifyBookingRejected = (phone, name, bookingCode, activityName, amount) =>
  sendSMS(phone,
    `Dear ${name},\n\n` +
    `We regret to inform you that your booking has been declined.\n\n` +
    `Activity: ${activityName}\n` +
    `Booking Code: ${bookingCode}\n` +
    `Refund: Rs.${Number(amount).toLocaleString("en-IN")}\n\n` +
    `Your refund will be processed within 5-7 business days.\n\n` +
    `Team GoaXplore`
  )

const notifyActivityCancelled = (phone, name, bookingCode, activityName, amount) =>
  sendSMS(phone,
    `Dear ${name},\n\n` +
    `We regret to inform you that the following activity has been cancelled.\n\n` +
    `Activity: ${activityName}\n` +
    `Booking Code: ${bookingCode}\n` +
    `Refund: Rs.${Number(amount).toLocaleString("en-IN")}\n\n` +
    `Your refund will be processed within 5-7 business days.\n\n` +
    `Team GoaXplore`
  )

const notifyBookingCancelled = (phone, name, bookingCode, activityName) =>
  sendSMS(phone,
    `Dear ${name},\n\n` +
    `Your booking has been cancelled successfully.\n\n` +
    `Activity: ${activityName}\n` +
    `Booking Code: ${bookingCode}\n\n` +
    `Team GoaXplore`
  )

// ─── Provider Notifications ───────────────────────────────────────────────────
const notifyProviderApproved = (phone, businessName) =>
  sendSMS(phone,
    `Dear ${businessName},\n\n` +
    `Congratulations! Your GoaXplore provider account has been APPROVED.\n\n` +
    `You can now log in to your dashboard and start listing activities.\n\n` +
    `Welcome aboard!\nTeam GoaXplore`
  )

const notifyProviderRejected = (phone, businessName, reason) =>
  sendSMS(phone,
    `Dear ${businessName},\n\n` +
    `We regret to inform you that your GoaXplore provider application has been rejected.\n\n` +
    `Reason: ${reason || 'Does not meet our verification criteria'}\n\n` +
    `For queries contact support@goaxplore.com\nTeam GoaXplore`
  )

const notifyProviderSuspended = (phone, businessName) =>
  sendSMS(phone,
    `Dear ${businessName},\n\n` +
    `Your GoaXplore provider account has been SUSPENDED.\n\n` +
    `Please contact support@goaxplore.com for assistance.\n\n` +
    `Team GoaXplore`
  )

const notifyProviderBookingReceived = (phone, businessName, bookingCode, activityName, customerName, date) =>
  sendSMS(phone,
    `Dear ${businessName},\n\n` +
    `New booking request received!\n\n` +
    `Activity: ${activityName}\n` +
    `Customer: ${customerName}\n` +
    `Booking Code: ${bookingCode}\n` +
    `Date: ${formatDate(date)}\n\n` +
    `Please log in to approve or reject.\nTeam GoaXplore`
  )

const notifyProviderBookingCancelled = (phone, businessName, bookingCode, activityName) =>
  sendSMS(phone,
    `Dear ${businessName},\n\n` +
    `A booking has been CANCELLED by the customer.\n\n` +
    `Activity: ${activityName}\n` +
    `Booking Code: ${bookingCode}\n\n` +
    `The slot is now available again.\nTeam GoaXplore`
  )

module.exports = {
  sendSMS,
  notifyBookingCreated,
  notifyBookingConfirmed,
  notifyBookingRejected,
  notifyActivityCancelled,
  notifyBookingCancelled,
  notifyProviderApproved,
  notifyProviderRejected,
  notifyProviderSuspended,
  notifyProviderBookingReceived,
  notifyProviderBookingCancelled,
}