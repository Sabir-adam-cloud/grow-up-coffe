/*************************
 * GROW-UP Coffee - app.js
 *************************/

/* =====================
   OUTILS GÉNÉRAUX
===================== */
function $(selector) {
  return document.querySelector(selector);
}
function $all(selector) {
  return document.querySelectorAll(selector);
}

/* =====================
   UPLOAD IMAGE PRODUIT
===================== */
$all('.file-input').forEach(input => {
  input.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const img = this.closest('.product-image').querySelector('img');
      if (img) {
        img.src = e.target.result;
        img.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  });
});

/* =====================
   CONNEXION
===================== */
const userTypeBtns = $all('.user-type-btn');
const loginForms = {
  client: $('#client-form'),
  employe: $('#employe-form'),
  employeur: $('#employeur-form')
};

userTypeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    userTypeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    Object.values(loginForms).forEach(f => f.classList.remove('active'));
    loginForms[btn.dataset.type].classList.add('active');
  });
});

// Connexion générique
Object.entries(loginForms).forEach(([type, form]) => {
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]').value;

    localStorage.setItem('user', JSON.stringify({
      email: email,
      type: type
    }));

    if (type === 'client') window.location.href = 'dash-client.html';
    if (type === 'employeur') window.location.href = 'dash-employeur.html';
    if (type === 'employe') alert("Interface employé non encore implémentée");
  });
});

/* =====================
   RÉSERVATIONS (CLIENT)
===================== */
const reserveBtn = $('#reserve-btn');
if (reserveBtn) {
  reserveBtn.addEventListener('click', () => {
    const datetime = $('#reserve-datetime').value;
    const persons = $('#reserve-persons').value;
    const details = $('#reserve-details').value;

    if (!datetime) {
      alert('Veuillez choisir une date');
      return;
    }

    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    reservations.push({
      id: Date.now(),
      date: datetime,
      persons,
      details
    });

    localStorage.setItem('reservations', JSON.stringify(reservations));
    alert('Réservation enregistrée');
    loadMyReservations();
  });
}

function loadMyReservations() {
  const table = $('#my-reservations-table tbody');
  if (!table) return;

  const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
  table.innerHTML = '';

  reservations.forEach(r => {
    table.innerHTML += `
      <tr>
        <td>${r.id}</td>
        <td>${r.date}</td>
        <td>${r.details || '-'}</td>
      </tr>`;
  });
}
loadMyReservations();

/* =====================
   DASH EMPLOYEUR
===================== */
const ordersTable = $('#orders-table tbody');
const reservTable = $('#reserv-table tbody');

if (ordersTable) {
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  ordersTable.innerHTML = orders.map(o => `
    <tr>
      <td>${o.id}</td>
      <td>${new Date(o.createdAt).toLocaleString()}</td>
      <td>${o.items.map(i => `${i.name} x${i.quantity}`).join(', ')}</td>
      <td>${o.total} MAD</td>
    </tr>
  `).join('');
}

if (reservTable) {
  const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
  reservTable.innerHTML = reservations.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${r.date}</td>
      <td>${r.details || '-'}</td>
    </tr>
  `).join('');
}

/* =====================
   DÉCONNEXION
===================== */
function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}
