/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import '@testing-library/jest-dom' // .toBeInTheDocument() matcher
import userEvent from '@testing-library/user-event'
import { fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import store from "../__mocks__/store.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";

const fs = require('fs')
const bodytoTestFile = () => {
  fs.writeFile('../test.txt', document.body.innerHTML, err => { if (err) { console.error(err) } })
}

let newBillContainer

function InitNewBillviaOnNavigate() {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))
  // rooter() render all the views into a root div by default
  const root = document.createElement("div")
  root.setAttribute("id", "root")
  document.body.append(root)
  // define window.onNavigate : app/router.js / onNavigate +-= window.history.pushState()
  router()
  // pushing billsUI into the vDOM
  window.onNavigate(ROUTES_PATH.NewBill)  
}

// init page + instanciate newbill container to let all the tests access its methods
function InitWithANewBillInstance() { 
  const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
  newBillContainer = new NewBill({ document, onNavigate, store: store, localStorage: window.localStorage })
  document.body.innerHTML = NewBillUI()
}

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {

    /*beforeEach(() => console.log('localStorage', localStorageMock))*/
    beforeAll(() => {
      return InitNewBillviaOnNavigate()
    })

    // * UNIT TEST / when connected as an  / UI : employee dashboard / container/bill.js coverage line 30
    test("Then the page and its form should be displayed", () => {
        expect(screen.getByTestId('form-new-bill')).toBeInTheDocument()
        expect(document.body.querySelector('#btn-send-bill')).toBeInTheDocument()
    })

    test("Then the mail icon in the vertical layout should be the only one highlighted", async () => {
        await waitFor(() => screen.getByTestId('icon-mail'))
        const mailIcon = screen.getByTestId('icon-mail')
        expect(mailIcon.classList.contains("active-icon")).toBeTruthy()
        expect(screen.getByTestId('icon-window').classList.contains("active-icon")).toBeFalsy()
    })
  })
})

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {

    beforeEach(()=>{
      return InitWithANewBillInstance() 
    })

    test("Then change file", async () => { // !!! better description
      await waitFor(() => screen.getByTestId('form-new-bill'))
      const fileInput = screen.getByTestId('file')
      const changeFileMockedFn = jest.fn(newBillContainer.handleChangeFile)
      fileInput.addEventListener('change', changeFileMockedFn)
      const file = new File(['test'], 'test.jpg', {type: 'image/jpg'}) // content name type
      userEvent.upload(fileInput, file)
      expect(changeFileMockedFn).toHaveBeenCalled()
      await waitFor(() => newBillContainer.billId==='1234')
      expect(newBillContainer.billId).toBe('1234')
      expect(newBillContainer.fileUrl).toBe('https://localhost:3456/images/test.jpg')
      // expect(newBillContainer.fileName).toBe('test.jpg')
      // check those values returned when mocked store succeed in creating a new entry. 
      // three values being from : create(bill) { return Promise.resolve({fileUrl: 'https://localhost:3456/images/test.jpg', key: '1234'}) },
    })

    /*test("Then change file > error ext", async () => { // !!! better description
      const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const newBillContainer = new NewBill({ document, onNavigate, store: store, localStorage: window.localStorage })
      document.body.innerHTML = NewBillUI()
      await waitFor(() => screen.getByTestId('form-new-bill'))
      const fileInput = screen.getByTestId('file')
      const changeFileMockedFn = jest.fn(newBillContainer.handleChangeFile)
      fileInput.addEventListener('change', changeFileMockedFn)
      const file = new File(['test'], 'test.zzz', {type: 'image/zzz'}) // content name type
      userEvent.upload(fileInput, file)
      expect(() => newBillContainer.handleChangeFile()).toThrow(new Error("Type de fichier invalide."))
      //expect(changeFileMockedFn).toThrow(new Error("Type de fichier invalide."))
    })*/

    test("Then the new bill form should be submitted when i click on the envoyer button", async () => {
        await waitFor(() => screen.getByTestId('form-new-bill'))
        newBillContainer.fileName = "test.jpg"
        newBillContainer.fileUrl = "https://localhost:3456/images/test.jpg"
        // needs to define newBill.filename to simulate a file has been selected before submitting
        const formNewBill = screen.getByTestId('form-new-bill')
        const clickSubmitNewBillMockedFn = jest.fn(newBillContainer.handleSubmit)
        formNewBill.addEventListener('submit', clickSubmitNewBillMockedFn)
        const sendNewBillBtn = document.body.querySelector("#btn-send-bill")
        userEvent.click(sendNewBillBtn)
        expect(clickSubmitNewBillMockedFn).toHaveBeenCalled()
    })

  })
})
