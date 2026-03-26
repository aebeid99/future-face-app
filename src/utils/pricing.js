// ─── Exchange Rates ────────────────────────────────────────────
const USD_TO_SAR = 3.75
const USD_TO_AED = 3.67
const VAT_RATE   = 0.15   // Saudi VAT 15%

// ─── Base Prices (USD per user per month) ─────────────────────
export const PLANS = {
  impactor: {
    free:       { price: 0,  label: 'Free',       users: 5,   okrs: 10 },
    pro:        { price: 6,  label: 'Pro',         users: Infinity, okrs: Infinity },
    enterprise: { price: 12, label: 'Enterprise',  users: Infinity, okrs: Infinity, custom: true },
  },
  robox: {
    free:       { price: 0,  label: 'Free',       users: 5 },
    pro:        { price: 4,  label: 'Pro',         users: Infinity },
    enterprise: { price: 8,  label: 'Enterprise',  users: Infinity, custom: true },
  },
  aiPilot: {
    included:   { price: 0,  label: 'Included',   note: 'Requires Impactor Pro + Robox Pro' },
    addon:      { price: 3,  label: 'Add-on',     note: 'Per user/month' },
  },
}

// ─── Currency Conversion ──────────────────────────────────────
export function toLocalCurrency(usd, currency = 'SAR') {
  switch (currency) {
    case 'SAR': return (usd * USD_TO_SAR).toFixed(2)
    case 'AED': return (usd * USD_TO_AED).toFixed(2)
    default:    return usd.toFixed(2)
  }
}

export const CURRENCY_SYMBOL = {
  SAR: 'SAR',
  AED: 'AED',
  USD: '$',
}

// ─── Main Price Calculator ─────────────────────────────────────
export function calcPrice({
  product,          // 'impactor' | 'robox' | 'aiPilot'
  plan,             // 'free' | 'pro' | 'enterprise'
  users = 1,
  currency = 'SAR',
  billing = 'monthly',  // 'monthly' | 'yearly'
  yearlyDiscount = 20,  // % discount for yearly
  includeVAT = true,
}) {
  const planDef = PLANS[product]?.[plan]
  if (!planDef || planDef.price === 0) {
    return { monthly: 0, total: 0, display: 'Free', vat: 0 }
  }

  const baseUSD = planDef.price * users
  const discounted = billing === 'yearly'
    ? baseUSD * (1 - yearlyDiscount / 100)
    : baseUSD

  const monthly = parseFloat(toLocalCurrency(discounted, currency))
  const vat     = includeVAT && currency === 'SAR'
    ? parseFloat((monthly * VAT_RATE).toFixed(2))
    : 0
  const total   = parseFloat((monthly + vat).toFixed(2))

  const sym = CURRENCY_SYMBOL[currency] || currency

  return {
    monthly,
    vat,
    total,
    display:     `${sym} ${monthly.toLocaleString()}`,
    displayTotal:`${sym} ${total.toLocaleString()}`,
    yearlyTotal: billing === 'yearly' ? `${sym} ${(total * 12).toLocaleString()}` : null,
  }
}

// ─── Free Tier Limits ─────────────────────────────────────────
export const FREE_LIMITS = {
  impactor: { users: 5,  okrs: 10 },
  robox:    { users: 5 },
}

export function isAtLimit(product, metric, currentValue, plan) {
  if (plan !== 'free') return false
  const limit = FREE_LIMITS[product]?.[metric]
  return limit !== undefined && currentValue >= limit
}

// ─── Bundle Discount ─────────────────────────────────────────
export function getBundleTotal({ impactorPlan, roboxPlan, users, currency, billing, yearlyDiscount }) {
  const imp = calcPrice({ product: 'impactor', plan: impactorPlan, users, currency, billing, yearlyDiscount })
  const rob = calcPrice({ product: 'robox',    plan: roboxPlan,    users, currency, billing, yearlyDiscount })
  const sym = CURRENCY_SYMBOL[currency] || currency

  const total = imp.monthly + rob.monthly
  const vat   = imp.vat + rob.vat
  const grand = imp.total + rob.total

  return {
    impactor: imp,
    robox:    rob,
    subtotal: total,
    vat,
    total:    grand,
    display:  `${sym} ${grand.toLocaleString()}`,
  }
}
