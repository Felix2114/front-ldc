document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const mensaje = document.getElementById('mensaje');

      try {
        const response = await fetch('https://api-ldc.onrender.com/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        

        if (response.ok) {
          // Ejemplo: redirige basado en rol
          if (data.rol === 'admin') {
            window.location.href = 'admin.html';
          } else if (data.rol === 'usuario') {
            window.location.href = 'mesera.html';
          } else {
            mensaje.textContent = 'Rol desconocido';
          }
        } else {
          mensaje.textContent = data.message || 'Error al iniciar sesión';
        }

      } catch (error) {
        mensaje.textContent = 'Error del servidor. Intenta más tarde.';
        console.error(error);
      }
    });