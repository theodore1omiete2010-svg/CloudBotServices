try {
    var savedTheme = localStorage.getItem('cbs-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  } catch (e) {}

document.addEventListener('DOMContentLoaded', function () {

(function(){
  // Backend connection points
  var API_ENDPOINTS = {
    signup: '/api/auth/signup',
    startVerification: '/api/auth/verification/start'
  };

  var verificationState = { email: false, phone: false };
  var verificationValues = { email: '', phone: '' };
  var verificationChallenges = { email: '', phone: '' };

  function readSignupContext() {
    try {
      var raw = sessionStorage.getItem('cbs-signup-context');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeSignupContext() {
    try {
      var email = document.getElementById('email');
      var phone = document.getElementById('phone');
      sessionStorage.setItem('cbs-signup-context', JSON.stringify({
        email: email ? email.value.trim() : '',
        phone: phone ? phone.value.trim() : '',
        countryCode: selectedCountry ? selectedCountry.iso : null,
        challengeIds: verificationChallenges
      }));
    } catch (e) {}
  }

  function clearSignupContext() {
    try { sessionStorage.removeItem('cbs-signup-context'); } catch (e) {}
  }

  function navigateToSameOrigin(url, fallbackMessage) {
    try {
      var target = new URL(url, window.location.href);
      if (target.origin !== window.location.origin) {
        throw new Error(fallbackMessage || 'The server returned an unsafe redirect.');
      }
      window.location.href = target.href;
    } catch (e) {
      throw new Error(fallbackMessage || 'The server returned an invalid redirect.');
    }
  }

  var html = document.documentElement;

  // Floating theme toggle
  var themeBtn = document.getElementById('themeToggleFloating');
  var themeLabel = document.getElementById('themeLabel');
  var sun = themeBtn.querySelector('.ftt-sun');
  var moon = themeBtn.querySelector('.ftt-moon');

  function setTheme(theme){
    html.setAttribute('data-theme', theme);
    if(theme === 'dark'){
      themeLabel.textContent = 'Dark';
      sun.style.opacity = '0';
      moon.style.opacity = '1';
    } else {
      themeLabel.textContent = 'Light';
      sun.style.opacity = '1';
      moon.style.opacity = '0';
    }
  }
  var savedTheme = (function(){ try { return localStorage.getItem('cbs-theme'); } catch(e) { return null; } })();
  setTheme(savedTheme === 'dark' ? 'dark' : 'light');

  themeBtn.addEventListener('click', function(){
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('cbs-theme', next); } catch(e) {}
    setTheme(next);
  });
  themeBtn.addEventListener('keydown', function(e){
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); themeBtn.click(); }
  });

  // ---- Verification flow ----
  function setVerificationButton(fieldId, verified) {
    var buttonId = fieldId === 'email' ? 'verifyEmailBtn' : 'verifyPhoneBtn';
    var button = document.getElementById(buttonId);
    if (!button) return;

    if (verified) {
      button.textContent = '✅ Verified';
      button.classList.add('is-verified');
      button.disabled = true;
    } else {
      button.textContent = fieldId === 'email' ? 'Verify email address' : 'Verify phone number';
      button.classList.remove('is-verified');
      button.disabled = false;
    }
  }

  function checkVerificationStatus() {
    var urlParams = new URLSearchParams(window.location.search);
    var verified = urlParams.get('verified');
    var field = urlParams.get('field');
    var challenge = urlParams.get('challenge');

    // Check if returning from verification page
    if (verified === 'email' || verified === 'phone') {
      // The verification page redirects back with ?verified=email&challenge=xxx
      setVerifiedFromReturn(verified, challenge);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  function getFieldValidation(fieldId) {
    var input = document.getElementById(fieldId);
    if (!input) return false;

    var value = input.value.trim();
    if (fieldId === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    if (fieldId === 'phone') {
      if (!selectedCountry) return false;
      var digits = value.replace(/\D/g, '');
      return digits.length >= 6 && digits.length <= 15;
    }

    return false;
  }

  function invalidateVerification(fieldId) {
    if (!verificationState[fieldId]) return;
    verificationState[fieldId] = false;
    verificationValues[fieldId] = '';
    setVerificationButton(fieldId, false);
  }

  function setVerifiedFromReturn(fieldId, returnedChallenge) {
    var input = document.getElementById(fieldId);
    var expectedChallenge = verificationChallenges[fieldId];
    
    if (!returnedChallenge || !expectedChallenge || returnedChallenge !== expectedChallenge) {
      showSignupStatus('The verification result is missing or no longer matches the active verification request. Please request verification again.', 'error');
      setVerificationButton(fieldId, false);
      return;
    }
    
    if (!input || !input.value.trim()) {
      showSignupStatus('Verification was completed, but the verified value is not available on this page. Please enter it again and verify it.', 'error');
      return;
    }

    verificationState[fieldId] = true;
    verificationValues[fieldId] = input.value.trim();
    setVerificationButton(fieldId, true);
    
    // Clear the challenge after successful verification
    verificationChallenges[fieldId] = '';
    writeSignupContext();
  }

  // ---- Start Verification (redirects to verification page) ----
  document.querySelectorAll('.verify-btn').forEach(function(vbtn) {
    vbtn.addEventListener('click', function() {
      var fieldId = vbtn.dataset.field;
      var input = document.getElementById(fieldId);
      var value = input ? input.value.trim() : '';

      if (!input || !getFieldValidation(fieldId)) {
        if (fieldId === 'email') {
          showSignupStatus('Enter a valid email address before requesting verification.', 'error');
        } else if (fieldId === 'phone') {
          showSignupStatus(selectedCountry ? 'Enter a valid phone number before requesting verification.' : 'Select your country before requesting phone verification.', 'error');
        }
        if (input) input.focus();
        return;
      }

      verificationState[fieldId] = false;
      verificationValues[fieldId] = '';

      var payload = {
        field: fieldId,
        value: value,
        mode: 'signup', // Important: tells backend this is for signup
        countryCode: fieldId === 'phone' && selectedCountry ? selectedCountry.iso : null,
        dialCode: fieldId === 'phone' && selectedCountry ? selectedCountry.dial : null
      };

      writeSignupContext();
      vbtn.disabled = true;
      vbtn.dataset.originalText = vbtn.textContent;
      vbtn.textContent = 'Sending...';

      fetch(API_ENDPOINTS.startVerification, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      })
        .then(function(response) {
          return response.text().then(function(text) {
            var data = {};
            try {
              data = text ? JSON.parse(text) : {};
            } catch (e) {
              if (response.ok && text) {
                throw new Error('The verification service returned an invalid response.');
              }
            }

            if (!response.ok) {
              throw new Error(data.message || data.error || 'Unable to start verification.');
            }

            return data;
          });
        })
        .then(function(data) {
          if (data.redirect) {
            navigateToSameOrigin(data.redirect, 'The verification service returned an invalid redirect.');
            return;
          }

          if (!data.challengeId) {
            throw new Error('The verification service did not return a challenge.');
          }

          verificationChallenges[fieldId] = String(data.challengeId);
          writeSignupContext();

          // Redirect to verification page with mode=signup
          var verificationUrl = 'verification-page.html?mode=signup&field=' + encodeURIComponent(fieldId) +
            '&challengeId=' + encodeURIComponent(data.challengeId) +
            '&value=' + encodeURIComponent(value);
          
          window.location.href = verificationUrl;
        })
        .catch(function(error) {
          showSignupStatus(error.message || 'Unable to start verification. Please try again.', 'error');
          vbtn.disabled = false;
          vbtn.textContent = vbtn.dataset.originalText || (fieldId === 'email' ? 'Verify email address' : 'Verify phone number');
        });
    });
  });

  // ---- Monitor input changes to invalidate verification ----
  ['email', 'phone'].forEach(function(fieldId) {
    var input = document.getElementById(fieldId);
    if (!input) return;
    input.addEventListener('input', function() {
      if (verificationValues[fieldId] && input.value.trim() !== verificationValues[fieldId]) {
        invalidateVerification(fieldId);
      }
      writeSignupContext();
    });
    input.addEventListener('change', function() {
      if (verificationState[fieldId] && input.value.trim() !== verificationValues[fieldId]) {
        invalidateVerification(fieldId);
      }
    });
  });

  // ---- Show/hide password toggles ----
  document.querySelectorAll('.toggle-password').forEach(function(toggle) {
    toggle.addEventListener('click', function() {
      var input = document.getElementById(toggle.dataset.target);
      var isVisible = input.type === 'text';
      input.type = isVisible ? 'password' : 'text';
      toggle.classList.toggle('is-visible', !isVisible);
      toggle.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
    });
  });

  // ---- Country selector (unchanged - same as before) ----
  var countries = [
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

  var selectedCountry = null;

  var trigger = document.getElementById('countryTrigger');
  var triggerFlag = document.getElementById('triggerFlag');
  var triggerDial = document.getElementById('triggerDial');
  var panel = document.getElementById('countryPanel');
  var list = document.getElementById('countryList');
  var search = document.getElementById('countrySearch');
  var backBtn = document.getElementById('countryBack');
  var phoneDetectHint = document.getElementById('phoneDetectHint');

  function renderList(filter) {
    var q = (filter || '').trim().toLowerCase();
    var matches = countries.filter(function(c){
      return !q || c.name.toLowerCase().includes(q) || c.dial.includes(q);
    });
    list.innerHTML = '';
    if (matches.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'country-empty';
      empty.textContent = 'No countries match your search.';
      list.appendChild(empty);
      return;
    }
    matches.forEach(function(c){
      var item = document.createElement('div');
      item.className = 'country-option' + (selectedCountry && c.iso === selectedCountry.iso ? ' is-active' : '');
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', selectedCountry && c.iso === selectedCountry.iso ? 'true' : 'false');

      var flag = document.createElement('span');
      flag.className = 'co-flag';
      flag.textContent = c.flag;

      var name = document.createElement('span');
      name.className = 'co-name';
      name.textContent = c.name;

      var dial = document.createElement('span');
      dial.className = 'co-dial-tag';
      dial.textContent = c.dial;

      item.appendChild(flag);
      item.appendChild(name);
      item.appendChild(dial);
      item.addEventListener('click', function(){ selectCountry(c); });
      list.appendChild(item);
    });
  }

  function selectCountry(c) {
    selectedCountry = c;
    triggerFlag.textContent = c.flag;
    triggerDial.textContent = c.dial;
    phoneDetectHint.textContent = '';
    closePanel();
    invalidateVerification('phone');
  }

  function openPanel() {
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    search.value = '';
    renderList('');
    search.focus();
  }

  function closePanel() {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  }

  trigger.addEventListener('click', function(){
    if (panel.hidden) { openPanel(); } else { closePanel(); }
  });
  backBtn.addEventListener('click', closePanel);
  search.addEventListener('input', function(){ renderList(search.value); });
  document.addEventListener('click', function(e){
    if (!panel.hidden && !panel.contains(e.target) && e.target !== trigger && !trigger.contains(e.target)) {
      closePanel();
    }
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && !panel.hidden) closePanel();
  });

  // ---- Restore signup context ----
  (function restoreSignupContext() {
    var context = readSignupContext();
    if (!context) return;

    var emailInput = document.getElementById('email');
    var phoneInput = document.getElementById('phone');
    if (emailInput && context.email) emailInput.value = context.email;
    if (phoneInput && context.phone) phoneInput.value = context.phone;

    if (context.challengeIds && typeof context.challengeIds === 'object') {
      verificationChallenges.email = context.challengeIds.email ? String(context.challengeIds.email) : '';
      verificationChallenges.phone = context.challengeIds.phone ? String(context.challengeIds.phone) : '';
    }

    if (context.countryCode) {
      var restoredCountry = countries.find(function(c) { return c.iso === context.countryCode; });
      if (restoredCountry) {
        selectedCountry = restoredCountry;
        triggerFlag.textContent = restoredCountry.flag;
        triggerDial.textContent = restoredCountry.dial;
      }
    }
  })();

  // Check if returning from verification page
  checkVerificationStatus();

  function showSignupStatus(message, type) {
    var status = document.getElementById('signupStatus');
    if (!status) return;
    status.textContent = message;
    status.className = 'form-status ' + (type || 'info');
    status.hidden = false;
  }

  function clearSignupStatus() {
    var status = document.getElementById('signupStatus');
    if (!status) return;
    status.hidden = true;
    status.textContent = '';
  }

  // ---- Form validation & submission ----
  var form = document.getElementById('signupForm');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    clearSignupStatus();
    var valid = true;

    var firstName = document.getElementById('firstName');
    var firstNameError = document.getElementById('firstNameError');
    if (!firstName.value.trim()) {
      firstNameError.style.display = 'block';
      valid = false;
    } else {
      firstNameError.style.display = 'none';
    }

    var surname = document.getElementById('surname');
    var surnameError = document.getElementById('surnameError');
    if (!surname.value.trim()) {
      surnameError.style.display = 'block';
      valid = false;
    } else {
      surnameError.style.display = 'none';
    }

    var email = document.getElementById('email');
    var emailError = document.getElementById('emailError');
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value.trim())) {
      emailError.style.display = 'block';
      valid = false;
    } else {
      emailError.style.display = 'none';
    }

    var phone = document.getElementById('phone');
    var phoneError = document.getElementById('phoneError');
    var phoneDigits = phone.value.trim().replace(/\D/g, '');
    if (!selectedCountry || phoneDigits.length < 6 || phoneDigits.length > 15) {
      phoneError.textContent = selectedCountry ? 'Please enter a valid phone number.' : 'Please select your country.';
      phoneError.style.display = 'block';
      valid = false;
    } else {
      phoneError.textContent = 'Please enter a valid phone number.';
      phoneError.style.display = 'none';
    }

    var password = document.getElementById('password');
    var passwordError = document.getElementById('passwordError');
    if (password.value.length < 8) {
      passwordError.style.display = 'block';
      valid = false;
    } else {
      passwordError.style.display = 'none';
    }

    var confirmPassword = document.getElementById('confirmPassword');
    var confirmPasswordError = document.getElementById('confirmPasswordError');
    if (confirmPassword.value !== password.value || !confirmPassword.value) {
      confirmPasswordError.style.display = 'block';
      valid = false;
    } else {
      confirmPasswordError.style.display = 'none';
    }

    // Check verification status
    var missingVerifications = [];

    if (!verificationState.email || verificationValues.email !== email.value.trim()) {
      missingVerifications.push('email address');
      valid = false;
    }

    if (!verificationState.phone || verificationValues.phone !== phone.value.trim()) {
      missingVerifications.push('phone number');
      valid = false;
    }

    if (missingVerifications.length) {
      var verificationMessage;
      if (missingVerifications.length === 2) {
        verificationMessage = 'Please verify your email address and phone number before creating your account.';
      } else {
        verificationMessage = 'Please verify your ' + missingVerifications[0] + ' before creating your account.';
      }
      showSignupStatus(verificationMessage, 'error');
    }

    if (!valid) {
      return;
    }

    var submitButton = form.querySelector('button[type="submit"]');
    var originalSubmitText = submitButton ? submitButton.textContent : '';

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Creating account...';
    }

    var payload = {
      firstName: firstName.value.trim(),
      surname: surname.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      countryCode: selectedCountry ? selectedCountry.iso : null,
      dialCode: selectedCountry ? selectedCountry.dial : null,
      password: password.value
    };

    fetch(form.getAttribute('action') || API_ENDPOINTS.signup, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    })
      .then(function(response) {
        return response.text().then(function(text) {
          var data = {};
          try {
            data = text ? JSON.parse(text) : {};
          } catch (e) {}

          if (!response.ok) {
            var serverMessage = data.message || data.error || 'Unable to create your account.';
            throw new Error(serverMessage);
          }

          return data;
        });
      })
      .then(function(data) {
        if (data.redirect) {
          clearSignupContext();
          navigateToSameOrigin(data.redirect, 'The signup service returned an invalid redirect.');
          return;
        }

        if (data.success !== true && !data.message) {
          throw new Error('The signup service returned an incomplete response.');
        }

        clearSignupContext();
        showSignupStatus(data.message || 'Account created successfully.', 'success');
        
        // Redirect after success
        if (data.redirectUrl) {
          setTimeout(function() {
            window.location.href = data.redirectUrl;
          }, 1500);
        }
      })
      .catch(function(error) {
        showSignupStatus(error.message || 'Something went wrong while creating your account. Please try again.', 'error');
      })
      .finally(function() {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalSubmitText;
        }
      });
  });
})();
});