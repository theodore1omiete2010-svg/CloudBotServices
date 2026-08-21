/**
 * script.js – Business Registration
 * ------------------------------------------------------------
 * CONFIGURATION (change these to match your backend):
 *   - API_ENDPOINT: the URL where the form data is sent.
 *   - CSRF_TOKEN: read from a meta tag; your backend must inject
 *     the actual token.
 *   - DETECTED_COUNTRY: read from a meta tag; your backend should
 *     set the ISO code (e.g., 'NG', 'US') based on the user's IP.
 * ------------------------------------------------------------
 */

// === CONFIGURATION ===
const API_ENDPOINT = '/api/business/register';
const CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]')?.content || '';
const DETECTED_COUNTRY_ISO = document.querySelector('meta[name="detected-country"]')?.content || '';

// === DOM REFS ===
const form = document.getElementById('businessForm');
const submitBtn = document.getElementById('submitBtn');
const formSuccess = document.getElementById('formSuccess');
const formError = document.getElementById('formError');

// === HELPER FUNCTIONS ===
function showFieldError(fieldId, show) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  if (show) field.classList.add('invalid');
  else field.classList.remove('invalid');
}

function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  const errEl = field.querySelector('.error');
  if (errEl) errEl.textContent = message;
}

function showGeneralError(message) {
  formError.textContent = message;
  formError.classList.add('show');
  formSuccess.classList.remove('show');
}

function showGeneralSuccess(message) {
  formSuccess.textContent = message;
  formSuccess.classList.add('show');
  formError.classList.remove('show');
}

function hideAllMessages() {
  formError.classList.remove('show');
  formSuccess.classList.remove('show');
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? 'Registering…' : 'Register Business';
}

// === CATEGORY DATA ===
const CATEGORIES = [
  { value: 'food', icon: '🍽️', name: 'Restaurant & Food' },
  { value: 'beauty', icon: '💇', name: 'Salon & Barber' },
  { value: 'retail', icon: '🛍️', name: 'Retail & E-commerce' },
  { value: 'services', icon: '💼', name: 'Professional Services' },
  { value: 'health', icon: '🏥', name: 'Health & Wellness' },
  { value: 'education', icon: '📚', name: 'Education & Training' },
  { value: 'logistics', icon: '🚚', name: 'Logistics & Delivery' },
  { value: 'events', icon: '🎉', name: 'Events & Entertainment' },
  { value: 'realestate', icon: '🏠', name: 'Real Estate & Property' },
  { value: 'hospitality', icon: '🏨', name: 'Hospitality & Travel' },
  { value: 'fitness', icon: '💪', name: 'Fitness & Sports' },
  { value: 'other', icon: '✨', name: 'Other' }
];

// === COUNTRY DATA (195+ countries) ===
const COUNTRIES = [
  { iso: 'AF', name: 'Afghanistan', dial: '+93', flag: '🇦🇫' },
  { iso: 'AL', name: 'Albania', dial: '+355', flag: '🇦🇱' },
  { iso: 'DZ', name: 'Algeria', dial: '+213', flag: '🇩🇿' },
  { iso: 'AD', name: 'Andorra', dial: '+376', flag: '🇦🇩' },
  { iso: 'AO', name: 'Angola', dial: '+244', flag: '🇦🇴' },
  { iso: 'AG', name: 'Antigua and Barbuda', dial: '+1', flag: '🇦🇬' },
  { iso: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
  { iso: 'AM', name: 'Armenia', dial: '+374', flag: '🇦🇲' },
  { iso: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { iso: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹' },
  { iso: 'AZ', name: 'Azerbaijan', dial: '+994', flag: '🇦🇿' },
  { iso: 'BS', name: 'Bahamas', dial: '+1', flag: '🇧🇸' },
  { iso: 'BH', name: 'Bahrain', dial: '+973', flag: '🇧🇭' },
  { iso: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { iso: 'BB', name: 'Barbados', dial: '+1', flag: '🇧🇧' },
  { iso: 'BY', name: 'Belarus', dial: '+375', flag: '🇧🇾' },
  { iso: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
  { iso: 'BZ', name: 'Belize', dial: '+501', flag: '🇧🇿' },
  { iso: 'BJ', name: 'Benin', dial: '+229', flag: '🇧🇯' },
  { iso: 'BT', name: 'Bhutan', dial: '+975', flag: '🇧🇹' },
  { iso: 'BO', name: 'Bolivia', dial: '+591', flag: '🇧🇴' },
  { iso: 'BA', name: 'Bosnia and Herzegovina', dial: '+387', flag: '🇧🇦' },
  { iso: 'BW', name: 'Botswana', dial: '+267', flag: '🇧🇼' },
  { iso: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { iso: 'BN', name: 'Brunei', dial: '+673', flag: '🇧🇳' },
  { iso: 'BG', name: 'Bulgaria', dial: '+359', flag: '🇧🇬' },
  { iso: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫' },
  { iso: 'BI', name: 'Burundi', dial: '+257', flag: '🇧🇮' },
  { iso: 'CV', name: 'Cabo Verde', dial: '+238', flag: '🇨🇻' },
  { iso: 'KH', name: 'Cambodia', dial: '+855', flag: '🇰🇭' },
  { iso: 'CM', name: 'Cameroon', dial: '+237', flag: '🇨🇲' },
  { iso: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { iso: 'CF', name: 'Central African Republic', dial: '+236', flag: '🇨🇫' },
  { iso: 'TD', name: 'Chad', dial: '+235', flag: '🇹🇩' },
  { iso: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱' },
  { iso: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { iso: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
  { iso: 'KM', name: 'Comoros', dial: '+269', flag: '🇰🇲' },
  { iso: 'CG', name: 'Congo', dial: '+242', flag: '🇨🇬' },
  { iso: 'CD', name: 'Congo (DRC)', dial: '+243', flag: '🇨🇩' },
  { iso: 'CR', name: 'Costa Rica', dial: '+506', flag: '🇨🇷' },
  { iso: 'HR', name: 'Croatia', dial: '+385', flag: '🇭🇷' },
  { iso: 'CU', name: 'Cuba', dial: '+53', flag: '🇨🇺' },
  { iso: 'CY', name: 'Cyprus', dial: '+357', flag: '🇨🇾' },
  { iso: 'CZ', name: 'Czechia', dial: '+420', flag: '🇨🇿' },
  { iso: 'CI', name: "Côte d'Ivoire", dial: '+225', flag: '🇨🇮' },
  { iso: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
  { iso: 'DJ', name: 'Djibouti', dial: '+253', flag: '🇩🇯' },
  { iso: 'DM', name: 'Dominica', dial: '+1', flag: '🇩🇲' },
  { iso: 'DO', name: 'Dominican Republic', dial: '+1', flag: '🇩🇴' },
  { iso: 'EC', name: 'Ecuador', dial: '+593', flag: '🇪🇨' },
  { iso: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { iso: 'SV', name: 'El Salvador', dial: '+503', flag: '🇸🇻' },
  { iso: 'GQ', name: 'Equatorial Guinea', dial: '+240', flag: '🇬🇶' },
  { iso: 'ER', name: 'Eritrea', dial: '+291', flag: '🇪🇷' },
  { iso: 'EE', name: 'Estonia', dial: '+372', flag: '🇪🇪' },
  { iso: 'SZ', name: 'Eswatini', dial: '+268', flag: '🇸🇿' },
  { iso: 'ET', name: 'Ethiopia', dial: '+251', flag: '🇪🇹' },
  { iso: 'FJ', name: 'Fiji', dial: '+679', flag: '🇫🇯' },
  { iso: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮' },
  { iso: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { iso: 'GA', name: 'Gabon', dial: '+241', flag: '🇬🇦' },
  { iso: 'GM', name: 'Gambia', dial: '+220', flag: '🇬🇲' },
  { iso: 'GE', name: 'Georgia', dial: '+995', flag: '🇬🇪' },
  { iso: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { iso: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { iso: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷' },
  { iso: 'GD', name: 'Grenada', dial: '+1', flag: '🇬🇩' },
  { iso: 'GT', name: 'Guatemala', dial: '+502', flag: '🇬🇹' },
  { iso: 'GN', name: 'Guinea', dial: '+224', flag: '🇬🇳' },
  { iso: 'GW', name: 'Guinea-Bissau', dial: '+245', flag: '🇬🇼' },
  { iso: 'GY', name: 'Guyana', dial: '+592', flag: '🇬🇾' },
  { iso: 'HT', name: 'Haiti', dial: '+509', flag: '🇭🇹' },
  { iso: 'HN', name: 'Honduras', dial: '+504', flag: '🇭🇳' },
  { iso: 'HK', name: 'Hong Kong', dial: '+852', flag: '🇭🇰' },
  { iso: 'HU', name: 'Hungary', dial: '+36', flag: '🇭🇺' },
  { iso: 'IS', name: 'Iceland', dial: '+354', flag: '🇮🇸' },
  { iso: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { iso: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
  { iso: 'IR', name: 'Iran', dial: '+98', flag: '🇮🇷' },
  { iso: 'IQ', name: 'Iraq', dial: '+964', flag: '🇮🇶' },
  { iso: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { iso: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱' },
  { iso: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { iso: 'JM', name: 'Jamaica', dial: '+1', flag: '🇯🇲' },
  { iso: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { iso: 'JO', name: 'Jordan', dial: '+962', flag: '🇯🇴' },
  { iso: 'KZ', name: 'Kazakhstan', dial: '+7', flag: '🇰🇿' },
  { iso: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { iso: 'KI', name: 'Kiribati', dial: '+686', flag: '🇰🇮' },
  { iso: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼' },
  { iso: 'KG', name: 'Kyrgyzstan', dial: '+996', flag: '🇰🇬' },
  { iso: 'LA', name: 'Laos', dial: '+856', flag: '🇱🇦' },
  { iso: 'LV', name: 'Latvia', dial: '+371', flag: '🇱🇻' },
  { iso: 'LB', name: 'Lebanon', dial: '+961', flag: '🇱🇧' },
  { iso: 'LS', name: 'Lesotho', dial: '+266', flag: '🇱🇸' },
  { iso: 'LR', name: 'Liberia', dial: '+231', flag: '🇱🇷' },
  { iso: 'LY', name: 'Libya', dial: '+218', flag: '🇱🇾' },
  { iso: 'LI', name: 'Liechtenstein', dial: '+423', flag: '🇱🇮' },
  { iso: 'LT', name: 'Lithuania', dial: '+370', flag: '🇱🇹' },
  { iso: 'LU', name: 'Luxembourg', dial: '+352', flag: '🇱🇺' },
  { iso: 'MO', name: 'Macao', dial: '+853', flag: '🇲🇴' },
  { iso: 'MG', name: 'Madagascar', dial: '+261', flag: '🇲🇬' },
  { iso: 'MW', name: 'Malawi', dial: '+265', flag: '🇲🇼' },
  { iso: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { iso: 'MV', name: 'Maldives', dial: '+960', flag: '🇲🇻' },
  { iso: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱' },
  { iso: 'MT', name: 'Malta', dial: '+356', flag: '🇲🇹' },
  { iso: 'MH', name: 'Marshall Islands', dial: '+692', flag: '🇲🇭' },
  { iso: 'MR', name: 'Mauritania', dial: '+222', flag: '🇲🇷' },
  { iso: 'MU', name: 'Mauritius', dial: '+230', flag: '🇲🇺' },
  { iso: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { iso: 'FM', name: 'Micronesia', dial: '+691', flag: '🇫🇲' },
  { iso: 'MD', name: 'Moldova', dial: '+373', flag: '🇲🇩' },
  { iso: 'MC', name: 'Monaco', dial: '+377', flag: '🇲🇨' },
  { iso: 'MN', name: 'Mongolia', dial: '+976', flag: '🇲🇳' },
  { iso: 'ME', name: 'Montenegro', dial: '+382', flag: '🇲🇪' },
  { iso: 'MA', name: 'Morocco', dial: '+212', flag: '🇲🇦' },
  { iso: 'MZ', name: 'Mozambique', dial: '+258', flag: '🇲🇿' },
  { iso: 'MM', name: 'Myanmar', dial: '+95', flag: '🇲🇲' },
  { iso: 'NA', name: 'Namibia', dial: '+264', flag: '🇳🇦' },
  { iso: 'NR', name: 'Nauru', dial: '+674', flag: '🇳🇷' },
  { iso: 'NP', name: 'Nepal', dial: '+977', flag: '🇳🇵' },
  { iso: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { iso: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { iso: 'NI', name: 'Nicaragua', dial: '+505', flag: '🇳🇮' },
  { iso: 'NE', name: 'Niger', dial: '+227', flag: '🇳🇪' },
  { iso: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { iso: 'KP', name: 'North Korea', dial: '+850', flag: '🇰🇵' },
  { iso: 'MK', name: 'North Macedonia', dial: '+389', flag: '🇲🇰' },
  { iso: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
  { iso: 'OM', name: 'Oman', dial: '+968', flag: '🇴🇲' },
  { iso: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { iso: 'PW', name: 'Palau', dial: '+680', flag: '🇵🇼' },
  { iso: 'PS', name: 'Palestine', dial: '+970', flag: '🇵🇸' },
  { iso: 'PA', name: 'Panama', dial: '+507', flag: '🇵🇦' },
  { iso: 'PG', name: 'Papua New Guinea', dial: '+675', flag: '🇵🇬' },
  { iso: 'PY', name: 'Paraguay', dial: '+595', flag: '🇵🇾' },
  { iso: 'PE', name: 'Peru', dial: '+51', flag: '🇵🇪' },
  { iso: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { iso: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
  { iso: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { iso: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦' },
  { iso: 'RO', name: 'Romania', dial: '+40', flag: '🇷🇴' },
  { iso: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺' },
  { iso: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
  { iso: 'KN', name: 'Saint Kitts and Nevis', dial: '+1', flag: '🇰🇳' },
  { iso: 'LC', name: 'Saint Lucia', dial: '+1', flag: '🇱🇨' },
  { iso: 'VC', name: 'Saint Vincent and the Grenadines', dial: '+1', flag: '🇻🇨' },
  { iso: 'WS', name: 'Samoa', dial: '+685', flag: '🇼🇸' },
  { iso: 'SM', name: 'San Marino', dial: '+378', flag: '🇸🇲' },
  { iso: 'ST', name: 'Sao Tome and Principe', dial: '+239', flag: '🇸🇹' },
  { iso: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { iso: 'SN', name: 'Senegal', dial: '+221', flag: '🇸🇳' },
  { iso: 'RS', name: 'Serbia', dial: '+381', flag: '🇷🇸' },
  { iso: 'SC', name: 'Seychelles', dial: '+248', flag: '🇸🇨' },
  { iso: 'SL', name: 'Sierra Leone', dial: '+232', flag: '🇸🇱' },
  { iso: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { iso: 'SK', name: 'Slovakia', dial: '+421', flag: '🇸🇰' },
  { iso: 'SI', name: 'Slovenia', dial: '+386', flag: '🇸🇮' },
  { iso: 'SB', name: 'Solomon Islands', dial: '+677', flag: '🇸🇧' },
  { iso: 'SO', name: 'Somalia', dial: '+252', flag: '🇸🇴' },
  { iso: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { iso: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { iso: 'SS', name: 'South Sudan', dial: '+211', flag: '🇸🇸' },
  { iso: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { iso: 'LK', name: 'Sri Lanka', dial: '+94', flag: '🇱🇰' },
  { iso: 'SD', name: 'Sudan', dial: '+249', flag: '🇸🇩' },
  { iso: 'SR', name: 'Suriname', dial: '+597', flag: '🇸🇷' },
  { iso: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { iso: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { iso: 'SY', name: 'Syria', dial: '+963', flag: '🇸🇾' },
  { iso: 'TW', name: 'Taiwan', dial: '+886', flag: '🇹🇼' },
  { iso: 'TJ', name: 'Tajikistan', dial: '+992', flag: '🇹🇯' },
  { iso: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
  { iso: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
  { iso: 'TL', name: 'Timor-Leste', dial: '+670', flag: '🇹🇱' },
  { iso: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬' },
  { iso: 'TO', name: 'Tonga', dial: '+676', flag: '🇹🇴' },
  { iso: 'TT', name: 'Trinidad and Tobago', dial: '+1', flag: '🇹🇹' },
  { iso: 'TN', name: 'Tunisia', dial: '+216', flag: '🇹🇳' },
  { iso: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
  { iso: 'TM', name: 'Turkmenistan', dial: '+993', flag: '🇹🇲' },
  { iso: 'TV', name: 'Tuvalu', dial: '+688', flag: '🇹🇻' },
  { iso: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
  { iso: 'UA', name: 'Ukraine', dial: '+380', flag: '🇺🇦' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { iso: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { iso: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { iso: 'UY', name: 'Uruguay', dial: '+598', flag: '🇺🇾' },
  { iso: 'UZ', name: 'Uzbekistan', dial: '+998', flag: '🇺🇿' },
  { iso: 'VU', name: 'Vanuatu', dial: '+678', flag: '🇻🇺' },
  { iso: 'VA', name: 'Vatican City', dial: '+379', flag: '🇻🇦' },
  { iso: 'VE', name: 'Venezuela', dial: '+58', flag: '🇻🇪' },
  { iso: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳' },
  { iso: 'YE', name: 'Yemen', dial: '+967', flag: '🇾🇪' },
  { iso: 'ZM', name: 'Zambia', dial: '+260', flag: '🇿🇲' },
  { iso: 'ZW', name: 'Zimbabwe', dial: '+263', flag: '🇿🇼' }
];

// === STATE ===
let selectedCategory = null;
let selectedCountry = null; // No default – user must pick

// Try to use backend‑detected country (if provided)
if (DETECTED_COUNTRY_ISO) {
  const detected = COUNTRIES.find(c => c.iso === DETECTED_COUNTRY_ISO);
  if (detected) {
    selectedCountry = detected;
    // Update trigger display
    document.getElementById('triggerFlag').textContent = detected.flag;
    document.getElementById('triggerDial').textContent = detected.dial;
  }
}

// === CATEGORY WIDGET ===
const catTrigger = document.getElementById('categoryTrigger');
const catIcon = document.getElementById('catIcon');
const catPlaceholder = document.getElementById('catPlaceholder');
const catSelected = document.getElementById('catSelected');
const catPanel = document.getElementById('categoryPanel');
const catList = document.getElementById('categoryList');
const catSearch = document.getElementById('categorySearch');
const catHiddenInput = document.getElementById('businessType');

function renderCategoryList(filter = '') {
  const q = filter.trim().toLowerCase();
  const matches = CATEGORIES.filter(c =>
    !q || c.name.toLowerCase().includes(q) || c.value.includes(q)
  );
  catList.innerHTML = '';
  if (!matches.length) {
    catList.innerHTML = '<div class="category-empty">No categories found.</div>';
    return;
  }
  matches.forEach(c => {
    const item = document.createElement('div');
    item.className = 'category-option' + (selectedCategory && c.value === selectedCategory.value ? ' is-active' : '');
    item.setAttribute('role', 'option');
    item.innerHTML = `<span class="cat-icon">${c.icon}</span><span class="cat-name">${c.name}</span><span class="cat-check">✓</span>`;
    item.addEventListener('click', () => selectCategory(c));
    catList.appendChild(item);
  });
}

function selectCategory(c) {
  selectedCategory = c;
  catIcon.textContent = c.icon;
  catPlaceholder.style.display = 'none';
  catSelected.style.display = 'block';
  catSelected.textContent = c.name;
  catHiddenInput.value = c.value;
  catTrigger.setAttribute('data-selected', 'true');
  closeCategoryPanel();
  showFieldError('field-businessType', false);
}

function openCategoryPanel() {
  catPanel.hidden = false;
  catTrigger.setAttribute('aria-expanded', 'true');
  catSearch.value = '';
  renderCategoryList('');
  setTimeout(() => catSearch.focus(), 50);
}

function closeCategoryPanel() {
  catPanel.hidden = true;
  catTrigger.setAttribute('aria-expanded', 'false');
  catTrigger.focus();
}

catTrigger.addEventListener('click', () => catPanel.hidden ? openCategoryPanel() : closeCategoryPanel());
catSearch.addEventListener('input', () => renderCategoryList(catSearch.value));
document.addEventListener('click', (e) => {
  if (!catPanel.hidden && !catPanel.contains(e.target) && e.target !== catTrigger && !catTrigger.contains(e.target)) {
    closeCategoryPanel();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !catPanel.hidden) closeCategoryPanel();
});

// === COUNTRY WIDGET ===
const countryTrigger = document.getElementById('countryTrigger');
const triggerFlag = document.getElementById('triggerFlag');
const triggerDial = document.getElementById('triggerDial');
const countryPanel = document.getElementById('countryPanel');
const countryList = document.getElementById('countryList');
const countrySearch = document.getElementById('countrySearch');
const countryBack = document.getElementById('countryBack');

function renderCountryList(filter = '') {
  const q = filter.trim().toLowerCase();
  const matches = COUNTRIES.filter(c =>
    !q || c.name.toLowerCase().includes(q) || c.dial.includes(q)
  );
  countryList.innerHTML = '';
  if (!matches.length) {
    countryList.innerHTML = '<div class="country-empty">No countries found.</div>';
    return;
  }
  matches.forEach(c => {
    const item = document.createElement('div');
    item.className = 'country-option' + (selectedCountry && c.iso === selectedCountry.iso ? ' is-active' : '');
    item.setAttribute('role', 'option');
    item.innerHTML = `<span class="co-flag">${c.flag}</span><span class="co-name">${c.name}</span><span class="co-dial-tag">${c.dial}</span>`;
    item.addEventListener('click', () => selectCountry(c));
    countryList.appendChild(item);
  });
}

function selectCountry(c) {
  selectedCountry = c;
  triggerFlag.textContent = c.flag;
  triggerDial.textContent = c.dial;
  closeCountryPanel();
  // Clear any country‑related error
  showFieldError('field-phone', false);
}

function openCountryPanel() {
  countryPanel.hidden = false;
  countryTrigger.setAttribute('aria-expanded', 'true');
  countrySearch.value = '';
  renderCountryList('');
  countrySearch.focus();
}

function closeCountryPanel() {
  countryPanel.hidden = true;
  countryTrigger.setAttribute('aria-expanded', 'false');
  countryTrigger.focus();
}

countryTrigger.addEventListener('click', () => countryPanel.hidden ? openCountryPanel() : closeCountryPanel());
countryBack.addEventListener('click', closeCountryPanel);
countrySearch.addEventListener('input', () => renderCountryList(countrySearch.value));
document.addEventListener('click', (e) => {
  if (!countryPanel.hidden && !countryPanel.contains(e.target) && e.target !== countryTrigger && !countryTrigger.contains(e.target)) {
    closeCountryPanel();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !countryPanel.hidden) closeCountryPanel();
});

// === FORM VALIDATION (real‑time on blur) ===
function validateField(fieldId, errorId, validator) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(errorId);
  if (!input || !errorEl) return;
  input.addEventListener('blur', () => {
    const valid = validator(input.value);
    if (!valid) {
      errorEl.style.display = 'block';
      showFieldError('field-' + fieldId, true);
    } else {
      errorEl.style.display = 'none';
      showFieldError('field-' + fieldId, false);
    }
  });
}

validateField('businessName', 'businessNameError', v => v.trim().length > 0);
validateField('businessEmail', 'businessEmailError', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()));
validateField('phone', 'phoneError', v => /^[0-9\s-]{6,14}$/.test(v.trim()));

// === FORM SUBMISSION ===
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAllMessages();

  // 1. Frontend validation
  let valid = true;

  const name = document.getElementById('businessName');
  const email = document.getElementById('businessEmail');
  const phone = document.getElementById('phone');

  // Business name
  if (!name.value.trim()) {
    showFieldError('field-businessName', true);
    valid = false;
  } else showFieldError('field-businessName', false);

  // Business email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    showFieldError('field-businessEmail', true);
    valid = false;
  } else showFieldError('field-businessEmail', false);

  // Phone number + country selection
  const phoneErrorEl = document.querySelector('#field-phone .error');
  if (!selectedCountry) {
    showFieldError('field-phone', true);
    if (phoneErrorEl) phoneErrorEl.textContent = 'Please select a country.';
    valid = false;
  } else if (!/^[0-9\s-]{6,14}$/.test(phone.value.trim())) {
    showFieldError('field-phone', true);
    if (phoneErrorEl) phoneErrorEl.textContent = 'Please enter a valid phone number (6–14 digits, spaces/dashes allowed).';
    valid = false;
  } else {
    showFieldError('field-phone', false);
  }

  // Category
  if (!selectedCategory) {
    showFieldError('field-businessType', true);
    valid = false;
  } else showFieldError('field-businessType', false);

  if (!valid) {
    showGeneralError('Please fix the highlighted fields.');
    return;
  }

  // 2. Build payload
  const fullPhone = selectedCountry.dial + ' ' + phone.value.trim();
  const payload = {
    businessName: name.value.trim(),
    businessEmail: email.value.trim(),
    phone: fullPhone,
    businessType: selectedCategory.value,
    businessAddress: document.getElementById('businessAddress').value.trim() || '',
    _csrf: CSRF_TOKEN
  };

  // 3. Submit to backend
  setLoading(true);
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      showGeneralSuccess(data.message || 'Business registered successfully!');
      form.reset();
      // Reset category
      selectedCategory = null;
      catIcon.textContent = '📋';
      catPlaceholder.style.display = 'block';
      catSelected.style.display = 'none';
      catHiddenInput.value = '';
      catTrigger.setAttribute('data-selected', 'false');
      // Reset country trigger to placeholder (but keep detection if present? We'll reset to placeholder)
      // Better to keep the selected country if detected, but if the form is reset, we might want to keep the country.
      // We'll keep the selected country as is.
      document.querySelectorAll('.field').forEach(f => f.classList.remove('invalid'));
      if (data.redirectUrl) {
        setTimeout(() => window.location.href = data.redirectUrl, 1500);
      }
    } else {
      // Server‑side validation errors: expect { field: 'businessEmail', message: '...' }
      if (data.field && data.message) {
        const fieldMap = {
          businessName: 'field-businessName',
          businessEmail: 'field-businessEmail',
          phone: 'field-phone',
          businessType: 'field-businessType'
        };
        const fieldId = fieldMap[data.field];
        if (fieldId) {
          showFieldError(fieldId, true);
          const errEl = document.querySelector(`#${fieldId} .error`);
          if (errEl) errEl.textContent = data.message;
          showGeneralError('Please correct the highlighted field.');
        } else {
          showGeneralError(data.message || 'Registration failed. Please try again.');
        }
      } else {
        showGeneralError(data.message || 'Registration failed. Please try again.');
      }
    }
  } catch (err) {
    showGeneralError('Network error – please check your connection and try again.');
    console.error('Submit error:', err);
  } finally {
    setLoading(false);
  }
});

// === THEME TOGGLE (unchanged) ===
(function initTheme() {
  try {
    const saved = localStorage.getItem('cbs-theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (_) {}

  const btn = document.getElementById('themeToggleFloating');
  const label = document.getElementById('themeLabel');
  const sun = btn.querySelector('.ftt-sun');
  const moon = btn.querySelector('.ftt-moon');

  function setTheme(theme) {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      label.textContent = 'Dark';
      sun.style.opacity = '0';
      moon.style.opacity = '1';
    } else {
      label.textContent = 'Light';
      sun.style.opacity = '1';
      moon.style.opacity = '0';
    }
  }

  const savedTheme = (() => {
    try { return localStorage.getItem('cbs-theme'); } catch (_) { return null; }
  })();
  setTheme(savedTheme === 'dark' ? 'dark' : 'light');

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('cbs-theme', next); } catch (_) {}
    setTheme(next);
  });

  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });
})();