import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }


  handleChangeFile = e => {
    e.preventDefault()
    //if(!JSON.parse(localStorage.getItem("user"))?.status) return console.log("User not connected.")
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0]
    const filePath = (file.name).split('/\\/g')
    const fileName = filePath[filePath.length-1]
    // [Bug Hunt] - Bills
    // correction / ajout :
    if(file.type!=="image/jpg" && file.type!=="image/jpeg" && file.type!=="image/png") {
      e.target.value = ""
      return window.alert("Type de fichier invalide.")
    }
    //
    const formData = new FormData()
    const email = JSON.parse(localStorage.getItem("user")).email
    formData.append('file', file)
    formData.append('email', email)

    // POST
    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true
        }
      })
      // if POST is a success : this.fileName = the input file name, this.billID = "1234", this.fileUrl = 'https://localhost:3456/images/test.jpg'
      // "1234" and a fixed url are returned by create(bill)
      .then(({fileUrl, key}) => {
        this.billId = key
        this.fileUrl = fileUrl
        this.fileName = fileName
      }).catch(error => console.error(error))
  }


  handleSubmit = e => {
    e.preventDefault()
    //if(!JSON.parse(localStorage.getItem("user"))?.status) return console.log("User not connected.")
    // console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }

    // [Bug Hunt] - Bills
    // correction / ajout :
    let ext = null
    /* istanbul ignore else */
    const regex = /.(jpg|jpeg|png)$/gi
    if(this.fileName.match(regex) == null)
    {
      return window.alert("Type de fichier invalide.")
    }
    this.updateBill(bill)
    // console.log(this.store.bills().list())
    this.onNavigate(ROUTES_PATH['Bills'])
  }


  // not need to cover this function by tests
  updateBill = (bill) => {
    /* istanbul ignore next */
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
      })
      .catch(error => console.error(error))
    }
  }
}