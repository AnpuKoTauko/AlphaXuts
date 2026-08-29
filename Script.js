// ---------- ROUTING ----------
function showPage(name){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('nav.links button, .mobile-menu button').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('[data-page="' + name + '"]').forEach(b => b.classList.add('active'));
  document.getElementById('stickyCta').style.display = (name === 'request') ? 'none' : '';
  window.scrollTo({top:0, behavior:'instant'});
}

// ---------- MOBILE MENU ----------
function toggleMenu(){ document.getElementById('mobileMenu').classList.toggle('open'); }
function closeMenu(){ document.getElementById('mobileMenu').classList.remove('open'); }

// ---------- AR 670-1 MODAL ----------
function openRegModal(){
  document.getElementById('regModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeRegModal(){
  document.getElementById('regModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ---------- CHOICE PILLS ----------
function wireChoiceRow(rowId){
  const row = document.getElementById(rowId);
  row.querySelectorAll('.choice-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      row.querySelectorAll('.choice-pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      row.dataset.selected = pill.dataset.value;
    });
  });
}
['platoonRow','phaseRow','dayRow'].forEach(wireChoiceRow);

// ---------- PHONE VALIDATION ----------
function isValidPhone(value){
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

// ---------- DISCORD WEBHOOK ----------
// NOTE: an incoming webhook can only POST messages — it cannot receive the
// status-button clicks below. Turning those buttons into working status
// controls requires a small Discord bot/application with an interactions
// endpoint (server-side), which is outside what a static webhook can do.
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1543055628472291398/7zK25Mi5HH6kDCs0DUeHlIiw1ZCp5uBmLmaucHUbDr9AQR6aXLVQinra9MZ4w79aIolv";

async function sendToDiscord(data){
  const embed = {
    title: "💈 NEW CUT REQUEST",
    color: 0x1fa2ff,
    fields: [
      { name: "Name", value: data.name, inline: true },
      { name: "Platoon", value: data.platoon.replace('Platoon ', ''), inline: true },
      { name: "Phase", value: data.phase.replace('Phase ', ''), inline: true },
      { name: "Phone", value: data.phone, inline: true },
      { name: "Preferred Day", value: data.day, inline: true },
      { name: "Status", value: "🟡 Pending", inline: true }
    ]
  };

  const payload = {
    embeds: [embed],
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 2, label: "🟡 Pending",   custom_id: "status_pending" },
          { type: 2, style: 3, label: "🟢 Confirmed", custom_id: "status_confirmed" },
          { type: 2, style: 4, label: "🔴 Declined",  custom_id: "status_declined" },
          { type: 2, style: 1, label: "🔵 Completed", custom_id: "status_completed" }
        ]
      }
    ]
  };

  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if(!res.ok){
    throw new Error("Discord webhook request failed (" + res.status + ")");
  }
}

// ---------- FORM SUBMIT ----------
const form = document.getElementById('cutForm');
const submitBtn = document.getElementById('submitBtn');
const formMsg = document.getElementById('formMsg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMsg.classList.remove('show');

  const name = document.getElementById('fName').value.trim();
  const phone = document.getElementById('fPhone').value.trim();
  const platoon = document.getElementById('platoonRow').dataset.selected;
  const phase = document.getElementById('phaseRow').dataset.selected;
  const day = document.getElementById('dayRow').dataset.selected;

  let valid = true;
  function toggleError(inputId, errId, ok){
    const errEl = document.getElementById(errId);
    if(inputId){ document.getElementById(inputId).classList.toggle('error', !ok); }
    errEl.classList.toggle('show', !ok);
    if(!ok) valid = false;
  }

  toggleError('fName', 'err-name', name.length > 1);
  toggleError(null, 'err-platoon', !!platoon);
  toggleError(null, 'err-phase', !!phase);
  toggleError('fPhone', 'err-phone', isValidPhone(phone));
  toggleError(null, 'err-day', !!day);

  if(!valid) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";

  try {
    await sendToDiscord({ name, phone, platoon, phase, day });
    form.style.display = 'none';
    document.getElementById('confirmCard').style.display = 'block';
  } catch(err){
    formMsg.textContent = "Couldn't send your request — " + err.message;
    formMsg.classList.add('show');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Request Appointment";
  }
});

function resetForm(){
  form.reset();
  document.querySelectorAll('.choice-pill').forEach(p => p.classList.remove('selected'));
  document.querySelectorAll('.choice-row').forEach(r => r.dataset.selected = '');
  document.querySelectorAll('.err-msg').forEach(e => e.classList.remove('show'));
  document.querySelectorAll('input').forEach(i => i.classList.remove('error'));
  form.style.display = 'block';
  document.getElementById('confirmCard').style.display = 'none';
}