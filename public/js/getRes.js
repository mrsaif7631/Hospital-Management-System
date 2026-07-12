

const id = document.querySelector('.getId').textContent.toString().substr(5)
console.log(id)
const add_rep_here = document.querySelector('.add-rep-here')
document.addEventListener('DOMContentLoaded', e => {
    const url = '/showRep/' + id
    fetch(url).then(response => {
        response.json().then(data => {
            console.log(data)
            const addRep = data
            console.log(addRep.length)
            if (addRep.length === 0) {
                document.querySelector('.no-rep-found').style.display = 'block'
            }
            else {
                for (let repo of addRep) {
                    add_rep_here.innerHTML +=
                        `
                            <div class="w-full bg-gray-100 mb-6 p-8 rounded mx-auto shadow-2xl">
                    <h1 class="title-font font-medium text-3xl text-gray-900">${repo.Type}</h1>
                    <p class="leading-relaxed mt-4">${repo.Type} </p>
                    <p class="leading-relaxed mt-4">Result: ${repo.Result}t</p>
                    <p class="leading-relaxed mt-4">Medicine: ${repo.Medicine}</p>
                    <p class="leading-relaxed mt-4">Remarks: ${repo.Remark}</p>
                </div>
                            `
                }
            }
        })
    })
})