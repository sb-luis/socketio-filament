renderHome();

let mode = '';
let form_name = null;
let form_password = null;
let errorElement = null;

document.addEventListener('click', (e) => {
  e.preventDefault();
  let c = e.target.classList[0];

  if (c == 'login' || c == 'register') {
    mode = 'auth';
    errorElement = null;
    renderForm(c);
  } else if (c == 'submit') {
    submitForm(e.target.innerHTML);
  } else if (c == 'cancel') {
    mode = '';
    errorElement = null;
    renderHome();
  }
});

document.addEventListener('keyup', (e) => {
  if (mode == 'auth' && form_name != null && form_password != null) {
    if(errorElement != null){
      let form_error = validateForm(form_name.value, form_password.value);
      if(form_error) return renderError(form_error);

      renderError('');
    }
  }
});

function renderHome() {
  document.querySelector('.home').innerHTML = `
    <h1>filament</h1>
    <p class="home-content">a thin conductive material, between you and your friends.</p>
    <div class="home-options">
      <button class="login">login</button>
      <button class="register">register</button>
    </div>`;
}

function renderForm(action) {
  let f = document.createElement('FORM');
  f.classList.add('auth-data');
  f.action = `/${action}`;

  f.innerHTML = `
    <p id="name" >
    <label for="">username:</label>
    <input type="text" autocomplete="off" class="auth-input">
    </p>

    <p id="password" >
    <label for="">password: </label>
    <input type="password" autocomplete="off" class="auth-input">
    </p>

    <div class="options">
    <button type="button" class="cancel">cancel</button>
    <button type="submit" class="submit">${action}</button>
    </div>`;

  document.querySelector('.home').innerHTML = '<h1>filament</h1>';
  document.querySelector('.home').append(f);

  form_name = document.getElementById('name').children[1];
  form_password = document.getElementById('password').children[1];
}

async function submitForm(action) {
  console.log('submitting form for: ' + action);

  if(!form_name || !form_password){
    return renderError("Something went wrong on the browser. You might want to refresh the page.")
  }

  let form_error = validateForm(form_name.value, form_password.value);
  if(form_error) return renderError(form_error);

  let uri = action == 'login' ? '/api/auth/login' : 'api/users/register';

  //Fetch API
  let _data = {
    username: form_name.value,
    password: form_password.value,
  };

  let res = await fetch(uri, {
    method: 'POST',
    body: JSON.stringify(_data),
    headers: { 'Content-type': 'application/json; charset=UTF-8' },
  }).catch((err) => console.log(err));

  if (res.status != 200) return renderError(await res.text());

  //If the response was succesful it means we´re authorized to proceed to the app.
  window.location = '/app';
}

function validateForm(name, password) {
  if(!name || name == ''){
    return '"username" is not allowed to be empty';
  }else if(name.length < 2){
    return '"username" length must be at least 2 characters long';
  }else if(name.length > 10){
    return '"username" length must be less than or equal to 10 characters long';
  }else if(!name.match(/^[a-z0-9]+$/i)){
    return '"username" must only contain alpha-numeric characters';
  }else if(!password || password == ''){
    return '"password" is not allowed to be empty';
  }else if(password.length < 5){
    return '"password" length must be at least 5 characters long';
  }else if(password.length > 20){
    return '"password" length must be less than or equal to 20 characters long';
  }

  return false;
}

function renderError(msg) {
  let err = document.getElementById('error-msg');
  errorElement = err;

  //If there is already an error message displayed.
  if (err) return (err.innerHTML = msg);

  //Otherwise create a new one
  let p = document.createElement('P');
  errorElement = p;
  p.id = 'error-msg';
  p.innerHTML = msg;
  document.querySelector('.auth-data').prepend(p);
}
