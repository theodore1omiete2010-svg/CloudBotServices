export function showToast(message) {
  const existing = document.querySelector(".cbs-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "cbs-toast";
  Object.assign(toast.style, {
    position:"fixed", bottom:"80px", left:"50%", transform:"translateX(-50%)",
    background:"var(--surface)", color:"var(--text)", padding:"10px 20px",
    borderRadius:"8px", border:"1px solid var(--border)",
    boxShadow:"0 8px 30px rgba(0,0,0,0.2)", fontSize:"12px",
    zIndex:"250", maxWidth:"90%", textAlign:"center"
  });
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export function openModal(html, options={}) {
  const backdrop=document.createElement("div");
  backdrop.className="cbs-modal-backdrop";
  Object.assign(backdrop.style,{
    position:"fixed",inset:"0",background:"rgba(0,0,0,.48)",
    backdropFilter:"blur(5px)",display:"grid",placeItems:"center",
    zIndex:"300",padding:"20px"
  });
  backdrop.innerHTML=html;
  document.body.appendChild(backdrop);
  if(options.closeOnBackdrop!==false) {
    backdrop.addEventListener("click",e=>{ if(e.target===backdrop) backdrop.remove(); });
  }
  return {
    element: backdrop,
    close: ()=>backdrop.remove()
  };
}

// NEW: Promise-based confirmation modal (replaces window.confirm)
export function confirmModal(message, title = "Confirm") {
  return new Promise((resolve) => {
    const modal = openModal(`
      <div class="modal-box" style="max-width:400px; text-align:center;">
        <div class="modal-header" style="border:none; padding-bottom:0;">
          <div class="modal-title" style="width:100%;">${escapeHTML(title)}</div>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-muted); font-size:14px; margin:10px 0 20px;">
            ${escapeHTML(message)}
          </p>
          <div class="modal-footer" style="justify-content:center; gap:16px; margin-top:0;">
            <button class="button" id="confirmNoBtn">Cancel</button>
            <button class="button primary" id="confirmYesBtn">Yes, Confirm</button>
          </div>
        </div>
      </div>
    `, { closeOnBackdrop: false });

    modal.element.querySelector("#confirmYesBtn").addEventListener("click", () => {
      modal.close();
      resolve(true);
    });
    modal.element.querySelector("#confirmNoBtn").addEventListener("click", () => {
      modal.close();
      resolve(false);
    });
  });
}

// Simple HTML escaping to prevent XSS
export function escapeHTML(str) {
  if (!str) return "";
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(str).replace(/[&<>"']/g, m => map[m]);
}

// Make available globally
window.showToast = showToast;
window.openCBSModal = openModal;
window.confirmModal = confirmModal;

// New: Password confirmation modal
export function confirmWithPassword(message, title = "Confirm") {
  return new Promise((resolve) => {
    const modal = openModal(`
      <div class="modal-box" style="max-width:400px;">
        <div class="modal-header" style="border:none; padding-bottom:0;">
          <div class="modal-title" style="width:100%;">${escapeHTML(title)}</div>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-muted); font-size:14px; margin:10px 0 20px;">
            ${escapeHTML(message)}
          </p>
          <div class="form-group">
            <label for="passwordConfirmInput">Enter your password to confirm</label>
            <input type="password" id="passwordConfirmInput" placeholder="Enter password" />
          </div>
          <div class="modal-footer" style="justify-content:center; gap:16px; margin-top:0;">
            <button class="button" id="confirmPwNoBtn">Cancel</button>
            <button class="button primary" id="confirmPwYesBtn">Confirm</button>
          </div>
        </div>
      </div>
    `, { closeOnBackdrop: false });

    const input = modal.element.querySelector('#passwordConfirmInput');
    const yesBtn = modal.element.querySelector('#confirmPwYesBtn');
    const noBtn = modal.element.querySelector('#confirmPwNoBtn');

    function checkPassword() {
      // In production, this would send to backend; for demo we check against 'admin'
      const pw = input.value.trim();
      // Hardcoded for demo – replace with API call
      if (pw === 'admin') {
        modal.close();
        resolve(true);
      } else {
        showToast('Incorrect password. Please try again.');
        input.value = '';
        input.focus();
      }
    }

    yesBtn.addEventListener('click', checkPassword);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') checkPassword();
    });
    noBtn.addEventListener('click', () => {
      modal.close();
      resolve(false);
    });
  });
}