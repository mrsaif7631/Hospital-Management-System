console.log('client side')
const login = document.querySelector('.login')
const signup = document.querySelector('.signup')
const signupBtn = document.querySelector('.signup-btn')
const get_data = document.querySelector('.get-data')
const me = document.querySelector('.me')
const loginBtn = document.querySelector('.login-btn')

signupBtn.addEventListener('click', (e) => {
    e.preventDefault()

    login.style.display = "none"
    get_data.style.display = "none"
    signup.style.display = "block"
})

loginBtn.addEventListener('click', (e) => {
    e.preventDefault()

    login.style.display = "block"
    get_data.style.display = "block"
    signup.style.display = "none"
})

const get_res = document.querySelector('.get-res')
const get_res_val = document.querySelector('.get-res-val')
const result_data = document.querySelector('.result-data')

get_res.addEventListener('submit', e => {
    e.preventDefault()
    
    result_data.innerHTML = `<p class="leading-relaxed my-4">Result Ready</p>
    <a class="py-1 my-4 text-white bg-purple-500 border-0  px-8 focus:outline-none hover:bg-purple-600 rounded text-lg"
        href="/getResult/${get_res_val.value}">Get</a>`
});
