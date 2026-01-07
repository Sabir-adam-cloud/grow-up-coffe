document.addEventListener('DOMContentLoaded', function () {
  // --- Connexion page logic ---
  if (document.querySelectorAll('.user-type-btn').length) {
    document.querySelectorAll('.user-type-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const type = this.dataset.type;
        document.querySelectorAll('.user-type-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.login-form').forEach(form => form.classList.remove('active'));
        const form = document.getElementById(`${type}-form`);
        if (form) form.classList.add('active');
        const err = document.getElementById('error-message'); if (err) err.classList.remove('active');
      });
    });

    function showError(message) {
      const errorDiv = document.getElementById('error-message');
      if (!errorDiv) return;
      errorDiv.textContent = message;
      errorDiv.classList.add('active');
      setTimeout(() => { errorDiv.classList.remove('active'); }, 5000);
    }

    function handleLogin(type, email, password, redirect) {
      // Basic validation
      if (!email || !password) { showError('Email et mot de passe requis'); return; }

      // For employeur, require specific credentials
      if (type === 'employeur') {
        const allowedEmail = 'employer1growup@gmail.com';
        const allowedPassword = '2020';
        if (email !== allowedEmail || password !== allowedPassword) { showError('Il y a une erreur'); return; }
      }

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      let user = users.find(u => u.email === email && u.type === type);
      if (!user) {
        user = { email, password, type: type, name: email.split('@')[0] || (type === 'employeur' ? 'Manager' : 'Client') };
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
      }
      localStorage.setItem('user', JSON.stringify({ email: user.email, type: user.type, name: user.name }));
      window.location.href = redirect;
    }



    const employeurForm = document.getElementById('employeur-form');
    if (employeurForm) {
      employeurForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('employeur-email').value;
        const password = document.getElementById('employeur-password').value;
        handleLogin('employeur', email, password, 'dash-employeur.html');
      });
    }

    const clientForm = document.getElementById('client-form');
    if (clientForm) {
      clientForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('client-email').value;
        const password = document.getElementById('client-password').value;
        handleLogin('client', email, password, 'dash-client.html');
      });
    }
  }

  // --- Dash Employé logic ---
  if (document.getElementById('add-order')) {
    const ordersKey = 'orders';
    function loadCart() { return JSON.parse(localStorage.getItem('cart') || '[]'); }
    function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); }
    function renderCart() {
      const cart = loadCart();
      const tbody = document.querySelector('#orders-table tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      let total = 0;
      cart.forEach(it => {
        const tr = document.createElement('tr');
        const subtotal = (it.price * it.qte);
        total += subtotal;
        tr.innerHTML = `<td>${it.name}</td><td>${it.price.toFixed(2)}</td><td>${it.qte}</td><td>${subtotal.toFixed(2)}</td>`;
        tbody.appendChild(tr);
      });
      const el = document.getElementById('total-amount'); if (el) el.textContent = total.toFixed(2);
    }

    // Employee-side render functions for orders and reservations
    function renderEmployeeOrders(){
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const tbody = document.querySelector('#employee-orders-table tbody');
      if(!tbody) return;
      tbody.innerHTML = '';
      if(orders.length === 0){ tbody.innerHTML = '<tr><td colspan="3">Aucune commande</td></tr>'; return; }
      orders.slice().reverse().forEach(o=>{
        const tr=document.createElement('tr');
        const date=new Date(o.createdAt).toLocaleString();
        const items = o.items.map(i=>`${i.name}×${i.qte}`).join(', ');
        tr.innerHTML = `<td>${o.id}</td><td>${date}</td><td>${items}</td>`;
        tbody.appendChild(tr);
      });
    }

    function renderEmployeeReservations(){
      const res = JSON.parse(localStorage.getItem('reservations') || '[]');
      const tbody = document.querySelector('#my-reservations-table tbody');
      if(!tbody) return;
      tbody.innerHTML = '';
      if(res.length === 0){ tbody.innerHTML = '<tr><td colspan="3">Aucune réservation</td></tr>'; return; }
      res.slice().reverse().forEach(r=>{
        const tr=document.createElement('tr');
        const date = new Date(r.date).toLocaleString();
        const details = `${r.persons ? r.persons + ' pers. — ' : ''}${r.details || '-'}`;
        tr.innerHTML = `<td>${r.id}</td><td>${date}</td><td>${details}</td>`;
        tbody.appendChild(tr);
      });
    }

    const addBtn = document.getElementById('add-order');
    addBtn.addEventListener('click', () => {
      const name = document.getElementById('item-name').value.trim();
      const price = parseFloat(document.getElementById('item-price').value) || 0;
      const qte = parseInt(document.getElementById('item-qte').value) || 1;
      if (!name || price <= 0 || qte <= 0) { alert("Remplissez correctement l'article, le prix et la quantité"); return; }
      const cart = loadCart();
      cart.push({ name, price, qte });
      saveCart(cart);
      renderCart();
      document.getElementById('item-name').value = '';
    });

    const saveBtn = document.getElementById('save-order');
    saveBtn.addEventListener('click', () => {
      const cart = loadCart();
      if (cart.length === 0) { alert('Panier vide'); return; }
      const orders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
      const total = cart.reduce((s, it) => s + (it.price * it.qte), 0);
      const order = { id: Date.now(), items: cart, total, createdAt: new Date().toISOString() };
      orders.push(order);
      localStorage.setItem(ordersKey, JSON.stringify(orders));
      localStorage.removeItem('cart');
      renderCart();
      // update employee order listing if present
      if (typeof renderEmployeeOrders === 'function') renderEmployeeOrders();
      alert('Commande enregistrée — Total: ' + total.toFixed(2) + ' MAD');
    });

    // Reservations (employee)
    function loadReservations(){ return JSON.parse(localStorage.getItem('reservations') || '[]'); }
    function saveReservations(list){ localStorage.setItem('reservations', JSON.stringify(list)); }

    const reserveBtn = document.getElementById('reserve-btn');
    if (reserveBtn) {
      reserveBtn.addEventListener('click', () => {
        const dt = document.getElementById('reserve-datetime').value;
        const persons = parseInt(document.getElementById('reserve-persons').value) || 1;
        const details = document.getElementById('reserve-details').value.trim();
        if (!dt) { alert('Choisissez une date et heure'); return; }
        const resList = loadReservations();
        const reservation = { id: Date.now(), date: dt, persons, details, createdAt: new Date().toISOString() };
        resList.push(reservation);
        saveReservations(resList);
        if (typeof renderEmployeeReservations === 'function') renderEmployeeReservations();
        alert('Réservation enregistrée pour ' + new Date(dt).toLocaleString());
        document.getElementById('reserve-datetime').value = '';
        document.getElementById('reserve-details').value = '';
      });
    }

    // render employee lists if present
    if (typeof renderEmployeeOrders === 'function') renderEmployeeOrders();
    if (typeof renderEmployeeReservations === 'function') renderEmployeeReservations();

    renderCart();
  }

  // --- Dash Employeur logic ---
  if (document.getElementById('orders-table') || document.getElementById('reserv-table')) {
    function renderOrders() {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const tbody = document.querySelector('#orders-table tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      if (orders.length === 0) { tbody.innerHTML = '<tr><td colspan="4">Aucune commande</td></tr>'; return; }
      orders.slice().reverse().forEach(o => {
        const tr = document.createElement('tr');
        const date = new Date(o.createdAt).toLocaleString();
        const items = o.items.map(i => `${i.name}×${i.qte}`).join(', ');
        tr.innerHTML = `<td>${o.id}</td><td>${date}</td><td>${items}</td><td>${o.total.toFixed(2)}</td>`;
        tbody.appendChild(tr);
      });
    }

    function renderReservations() {
      const res = JSON.parse(localStorage.getItem('reservations') || '[]');
      const tbody = document.querySelector('#reserv-table tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      if (res.length === 0) { tbody.innerHTML = '<tr><td colspan="3">Aucune réservation</td></tr>'; return; }
      res.slice().reverse().forEach(r => {
        const tr = document.createElement('tr');
        const details = `${r.persons ? r.persons + ' pers. — ' : ''}${r.details || '-'}`;
        tr.innerHTML = `<td>${r.id}</td><td>${new Date(r.date).toLocaleString()}</td><td>${details}</td>`;
        tbody.appendChild(tr);
      });
    }

    function renderReclamations() {
      const reclamations = JSON.parse(localStorage.getItem('reclamations') || '[]');
      const tbody = document.querySelector('#reclamations-table tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      if (reclamations.length === 0) { tbody.innerHTML = '<tr><td colspan="5">Aucune réclamation</td></tr>'; return; }
      reclamations.slice().reverse().forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${r.id}</td><td>${new Date(r.createdAt).toLocaleString()}</td><td>${r.clientEmail || '-'}</td><td>${r.subject || '-'}</td><td>${r.status || 'en-attente'}</td>`;
        tbody.appendChild(tr);
      });
    }

    renderOrders();
    renderReservations();
    renderReclamations();
  }

});
