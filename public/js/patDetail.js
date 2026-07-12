const add_rep = document.querySelector('.add-rep')
const add_rep_form = document.querySelector('.add-report-form')
const cls = document.querySelector('.close')

add_rep.addEventListener('click', e => {
    e.preventDefault()
    cls.style.display = 'inline'
    add_rep_form.style.display = 'block'
})

cls.addEventListener('click', e => {
    e.preventDefault()
    cls.style.display = 'none'
    add_rep_form.style.display = 'none'
})

const id = document.querySelector('.getId').textContent.toString().substr(5)
//console.log(id)
const add_rep__here = document.querySelector('.add-rep-here')

document.addEventListener("DOMContentLoaded", (e) => {
    const url = '/findPatients'
    fetch(url).then(response => {
        response.json().then(data => {
            for (let patient of data) {
                if (patient._id === id) {
                    const addRep = patient.reports
                    console.log(addRep.length)
                    if(addRep.length===0){
                        document.querySelector('.no-rep-found').style.display='block'
                    }
                    else{
                        let cnt =0;
                        for (let repo of addRep) {
                            cnt++;
                            add_rep__here.innerHTML +=
                                `
                           
                <div class="flex relative pb-10 sm:items-center md:w-2/3 mx-auto">
                <div class="h-full w-6 absolute inset-0 flex items-center justify-center">
                    <div class="h-full w-1 bg-gray-200 pointer-events-none"></div>
                </div>
                <div
                    class="flex-shrink-0 w-6 h-6 rounded-full mt-10 sm:mt-0 inline-flex items-center justify-center bg-purple-500 text-white relative z-10 title-font font-medium text-sm">
                    ${cnt}
                </div>
                <div class="flex-grow md:pl-8 pl-6 flex sm:items-center items-start flex-col sm:flex-row">
                    <div
                        class="flex-shrink-0 w-24 h-24 bg-purple-100 text-purple-500 rounded-full inline-flex items-center justify-center">
                        <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                            stroke-width="2" class="w-12 h-12" viewBox="0 0 24 24">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <div class="flex-grow sm:pl-6 mt-6 sm:mt-0 ">
                        <h2 class="font-medium title-font text-purple-600 text-2xl">${repo.Type}</h2>
                        <p class=" mb-1 text-xs">${repo.date}</p>
                        <div class="flex flex-wrap rounded-tl rounded-tr bg-gray-500 text-white border-b-2">
                            <p class="pl-2 w-1/3 py-1 border-r-2">Result</p>
                            <p class="leading-relaxed mx-auto text-center">${repo.Result}.</p>    
                        </div>
                        <div class="flex flex-wrap  bg-gray-500 text-white border-b-2">
                            <p class="pl-2 w-1/3  py-1 border-r-2">Medicines</p>
                            <p class="leading-relaxed mx-auto text-center">${repo.Medicine}.</p>    
                        </div>
                        <div class="flex flex-wrap rounded-bl rounded-br bg-gray-500 text-white border-b-2">
                            <p class="pl-2 w-1/3 py-1 border-r-2">Remarks</p>
                            <p class="leading-relaxed mx-auto text-center">${repo.Remark}.</p>    
                        </div>
                    
                    </div>
                </div>
            </div>
                            `
                        }
                    }
                }
            }
        })
    })
});