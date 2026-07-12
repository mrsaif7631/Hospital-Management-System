
console.log('client')

const table = document.querySelector('.disp-pat')


document.addEventListener("DOMContentLoaded", (e) => {
    const url = '/findPatients?sortBy=createdAt_desc'
    fetch(url).then(response => {
        response.json().then(data => {
            let total = 0
            let admit = 0;
            let dis = 0
            for (let patient of data) {
                if (patient.status === 'Admit') {
                    admit++;
                }
                else {
                    dis++;
                }
                total++;

                table.innerHTML += ` <tr class="text-center">
<td class="border-b-2 border-r-2">${patient._id}</td>
<td class="border-b-2 border-r-2">${patient.name}</td>
<td class="border-b-2 border-r-2">${patient.phone}</td>
<td class="border-b-2 border-r-2">${patient.createdAt.toString().substr(0, 10)}</td>
<td class="p-2 border-b-2"><a class="text-white bg-purple-500 border-0 py-1 px-8 focus:outline-none hover:bg-purple-600 rounded text-lg" href="/getPat/${patient._id}">Get</a></td>
</tr>`
            }
            console.log(total, admit, dis)
            document.querySelector('.total').textContent = total
            document.querySelector('.dis').textContent = dis
            document.querySelector('.admit').textContent = admit
        })
    })
});

const add_pat = document.querySelector('.add-pat')
const search_pat = document.querySelector('.search-pat')
const add_pat_form = document.querySelector('.add-pat-form')
const search_pat_form = document.querySelector('.search-pat-form')
const search = document.querySelector('#search')
const cls = document.querySelector('.close')

add_pat.addEventListener('click', e => {
    e.preventDefault()
    add_pat_form.style.display = 'block'
    search_pat_form.style.display = 'none'
    cls.style.display = 'inline'
})

search_pat.addEventListener('click', e => {
    e.preventDefault()
    search_pat_form.style.display = 'block'
    add_pat_form.style.display = 'none'
    cls.style.display = 'inline'
})

cls.addEventListener('click', e => {
    e.preventDefault()
    search_pat_form.style.display = 'none'
    add_pat_form.style.display = 'none'
    cls.style.display = 'none'
    search_result.style.display = 'none'
})

const search_form_submit = document.querySelector('.search-form-submit')
const search_result = document.querySelector('.search-result')

search_form_submit.addEventListener('submit', e => {
    e.preventDefault()
    console.log(search.value)
    const url = `/findPatients`
    fetch(url).then(response => {
        response.json().then(data => {
            let check = false
            for (let patient of data) {
                if (patient._id === search.value) {
                    console.log(patient.name)
                    search_result.style.display = 'inline'
                    search_result.innerHTML = `<table class="disp-pat mx-auto table-auto w-full shadow-2xl">
                    <tr>
                        <th class="bg-purple-500 text-white py-4 border-r-2">Patient Id</th>
                        <th class="bg-purple-500 text-white py-4 border-r-2">Name</th>
                        <th class="bg-purple-500 text-white py-4 border-r-2">Phone</th>
                        <th class="bg-purple-500 text-white py-4 border-r-2">Date</th>
                        <th class="bg-purple-500 text-white py-4">Get Details</th>
                    </tr>
                    <tr class="text-center">
                    <td class="border-b-2 border-r-2">${patient._id}</td>
                    <td class="border-b-2 border-r-2">${patient.name}</td>
                    <td class="border-b-2 border-r-2">${patient.phone}</td>
                    <td class="border-b-2 border-r-2">${patient.createdAt.toString().substr(0, 10)}</td>
                    <td class="p-2 border-b-2"><a class="text-white bg-purple-500 border-0 py-1 px-8 focus:outline-none hover:bg-purple-600 rounded text-lg" href="/getPat/${patient._id}">get</a></td>
                    </tr>
                    
                </table>`
                    check = true
                    break;
                }
            }
            
            if(!check){
                search_result.style.display = 'inline'
                search_result.innerHTML = `<h1 class="title-font  mb-4 py-2 px-8 font-bold  text-center">No Patient found!</h1>`
            }
        })
    }).catch(err=>{
        console.log(err)
    })
})