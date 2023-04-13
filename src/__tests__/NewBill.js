/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import '@testing-library/jest-dom' // .toBeInTheDocument() matcher
import userEvent from '@testing-library/user-event'
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

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    // * UNIT TEST / when connected as an  / UI : employee dashboard / container/bill.js coverage line 30
    test("Then the page and its form should be displayed", () => {
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
        expect(screen.getByTestId('form-new-bill')).toBeInTheDocument()
        expect(document.body.querySelector('#btn-send-bill')).toBeInTheDocument()
    })

    test("Then the mail icon in the vertical layout should be the only one highlighted", async () => {
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
        // pushing NewBillUI into the vDOM
        window.onNavigate(ROUTES_PATH.NewBill)
        await waitFor(() => screen.getByTestId('icon-mail'))
        const mailIcon = screen.getByTestId('icon-mail')
        expect(mailIcon.classList.contains("active-icon")).toBeTruthy()
        expect(screen.getByTestId('icon-window').classList.contains("active-icon")).toBeFalsy()
    })

    test("Then the new bill form should be submitted when i click on the envoyer button", async () => {
      const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      // we need to instanciate the newbill container to acces its methods for our test
      const newBillContainer = new NewBill({ document, onNavigate, store: store, localStorage: window.localStorage })
      document.body.innerHTML = NewBillUI()
      await waitFor(() => screen.getByTestId('form-new-bill'))
      newBillContainer.fileName = "aaaaa.jpg"
      newBillContainer.fileUrl = "www.google.com/test/"
      console.log(newBillContainer)
      // needs to define newBill.filename to simulate a file has been selected before submitting
      const formNewBill = screen.getByTestId('form-new-bill')
      const clickSubmitNewBillMockedFn = jest.fn(newBillContainer.handleSubmit)
      formNewBill.addEventListener('submit', clickSubmitNewBillMockedFn)
      bodytoTestFile()
      const sendNewBillBtn = document.body.querySelector("#btn-send-bill")
      userEvent.click(sendNewBillBtn)
      expect(clickSubmitNewBillMockedFn).toHaveBeenCalled()
  })



  })
})
