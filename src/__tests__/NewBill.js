/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import '@testing-library/jest-dom' // .toBeInTheDocument() matcher
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";

const fs = require('fs')
const bodytoTestFile = () => {
  fs.writeFile('../test.txt', document.body.innerHTML, err => { if (err) { console.error(err) } })
}

// verticalLayout + NewBillsUI
function InitNewBillviaOnNavigate() {
    // rooter() render all the views into a root div by default
    document.body.innerHTML = "<div id='root'></div>"
    // define window.onNavigate (app/router.js) : a derivative of window.history.pushState()
    router()
    // pushing verticalLayout + billsUI into the vDOM
    window.onNavigate(ROUTES_PATH.NewBill)
}

// NewBillsUI alone + instanciation of newbill container > access to the related methods
function InitWithANewBillInstance() {
  document.body.innerHTML = NewBillUI()
  newBillContainer = new NewBill({ document, onNavigate : jest.fn, store: {...mockStore}, localStorage: window.localStorage })
}

function fillForm(){
  userEvent.type(screen.getByTestId("expense-name"), "resto")
  userEvent.type(screen.getByTestId("amount"), "100")
  userEvent.type(screen.getByTestId("datepicker"), "2023-04-20")
  userEvent.type(screen.getByTestId("vat"), "20")
  userEvent.type(screen.getByTestId("pct"), "20")
  userEvent.type(screen.getByTestId("commentary"), "commentary")
}

let newBillContainer
Object.defineProperty(window, 'localStorage', { value: {...localStorageMock} })
window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {

    beforeAll(() => InitNewBillviaOnNavigate())

    // * UNIT TEST / when connected as an  / UI : employee dashboard / container/bill.js coverage line 30
    test("Then the page and its form should be displayed", async () => {
        await waitFor(() => screen.getByTestId('form-new-bill'))
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

    beforeEach(()=>{ InitWithANewBillInstance() })

    test("Then the submit button is triggering a form subsmission", async () => {
      // wait for the UI to populate the DOM
      await waitFor(() => screen.getByTestId('form-new-bill'))
      const fileInput = screen.getByTestId('file')
      // add a file to the form
      userEvent.upload(fileInput, new File(['(-(•̀ᵥᵥ•́)-)'], 'dracula.png', {type: 'image/png'}))
      await waitFor(() => expect(newBillContainer.billId).toBe('1234'))
      // when done, deal with submission triggering
      const formNewBill = screen.getByTestId('form-new-bill')
      const clickSubmitNewBillMockedFn = jest.fn(newBillContainer.handleSubmit)
      formNewBill.addEventListener('submit', clickSubmitNewBillMockedFn)
      const sendNewBillBtn = document.body.querySelector("#btn-send-bill")
      userEvent.click(sendNewBillBtn)
      // check if handlesubmit has been called after submission
      expect(clickSubmitNewBillMockedFn).toHaveBeenCalled()
    })

    test("Then an invalid file can't be successfully added to the form", async () => {
      await waitFor(() => screen.getByTestId('form-new-bill'))
      const fileInput = screen.getByTestId('file')
      const file = new File(['hello'], 'https://localhost:3456/images/test.zzz', {type: 'image/zzz'})
      // const event = { preventDefault: () => {}, target:{ value : 'https://localhost:3456/images/test.zzz', files:{ 0 : file}}}
      const changeFileMockedFn = jest.fn(newBillContainer.handleChangeFile)
      fileInput.addEventListener('change', () => changeFileMockedFn) // for integration test
      userEvent.upload(fileInput, file)
      expect(fileInput.value).toBe("")
      expect(fileInput.files).toStrictEqual([])
    })

    test("Then a valid file can be successfully added to the form", async () => {
        await waitFor(() => screen.getByTestId('form-new-bill'))
        const fileInput = screen.getByTestId('file')
        const changeFileMockedFn = jest.fn(newBillContainer.handleChangeFile)
        fileInput.addEventListener('change', changeFileMockedFn)
        userEvent.upload(fileInput, new File(['(-(•̀ᵥᵥ•́)-)'], 'dracula.png', {type: 'image/png'}))
        // fireEvent.change(fileInput, { target: { files: [new File(['(⌐□_□)'], 'chucknorris.png', {type: 'image/png'})], }, })
        expect(changeFileMockedFn).toHaveBeenCalled()
        // POST request happens in handlechangefile
        // due to mocked store : create(bill) { return Promise.resolve({fileUrl: 'https://localhost:3456/images/test.jpg', key: '1234'}) },
        await waitFor(() => expect(newBillContainer.billId).toBe('1234'))
        expect(newBillContainer.fileUrl).toBe('https://localhost:3456/images/test.jpg')
        expect(newBillContainer.fileName).toBe("dracula.png")
    })

    test("then an alert should be triggered when an invalid file is submitted with the form", async () => {
        await waitFor(() => screen.getByTestId('form-new-bill'))
        newBillContainer.fileName = "test.zzz"
        newBillContainer.fileUrl = "https://localhost:3456/images/test.zzz"
        fillForm()
        const event = { preventDefault: () => {}, target:{querySelector : () => document.querySelector}}
        const formNewBill = screen.getByTestId('form-new-bill')
        const clickSubmitNewBillMockedFn = jest.fn(newBillContainer.handleSubmit)
        formNewBill.addEventListener('submit', () => clickSubmitNewBillMockedFn(event))
        const sendNewBillBtn = document.body.querySelector("#btn-send-bill")
        jest.spyOn(window, 'alert').mockImplementation(() => {})
        userEvent.click(sendNewBillBtn)
        expect(window.alert).toBeCalledWith("Type de fichier invalide.")
        // Note : https://github.com/testing-library/react-testing-library/issues/624
        // = no way for jest to catch an error thrown through the triggering of an event
    })

    test("then the API should be called when a valid form is submitted", async () => {
      await waitFor(() => screen.getByTestId('form-new-bill'))
      newBillContainer.fileName = "test.jpg"
      newBillContainer.fileUrl = "https://localhost:3456/images/test.jpg"
      // const file = new File(['hello'], 'https://localhost:3456/images/test.zzz', {type: 'image/zzz'})
      fillForm()
      const event = { preventDefault: () => {}, target:{querySelector : () => document.querySelector}}
      const formNewBill = screen.getByTestId('form-new-bill')
      const clickSubmitNewBillMockedFn = jest.fn(newBillContainer.handleSubmit)
      formNewBill.addEventListener('submit', () => clickSubmitNewBillMockedFn(event))
      const sendNewBillBtn = document.body.querySelector("#btn-send-bill")
      newBillContainer.updateBill = jest.fn(newBillContainer.updateBill)
      userEvent.click(sendNewBillBtn)
      expect(newBillContainer.updateBill).toHaveBeenCalled()
    })

  })
})

// 201 created / 400 (Bad Request) / 401 (Unauthorized) / 403 (Forbidden) / 412 (Precondition Failed) / 500 (Internal Server Error)

// integration test : interactions POST

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on the Bills Page", () => {

    beforeAll(()=>{ 
      jest.spyOn(console, "error") 
    })

    test("Then a succesfull POST", async () => {
      InitWithANewBillInstance()
      await waitFor(() => screen.getByTestId('form-new-bill'))
      const fileInput = screen.getByTestId('file')
      const changeFileMockedFn = jest.fn(newBillContainer.handleChangeFile)
      fileInput.addEventListener('change', changeFileMockedFn)
      userEvent.upload(fileInput, new File(['(-(•̀ᵥᵥ•́)-)'], 'dracula.png', {type: 'image/png'}))
      expect(changeFileMockedFn).toHaveBeenCalled()
      // those values are expected to be returned when the POST request to the mockedStore is successfull
      await waitFor(() => expect(newBillContainer.billId).toBe('1234'))
      expect(newBillContainer.fileUrl).toBe('https://localhost:3456/images/test.jpg')
      expect(newBillContainer.fileName).toBe("dracula.png")
    })

    
        test("Then an API call failing with a 500 error should console.error 500 error message", async () => {
          mockStore.bills = jest.fn(mockStore.bills)
          mockStore.bills.mockImplementationOnce(() => {
            return {
              create : () =>  {
                return Promise.reject("Erreur 500")
              }
          }})
          InitNewBillviaOnNavigate()
          const fileInput = screen.getByTestId('file')
          const changeFileMockedFn = jest.fn(newBillContainer.handleChangeFile)
          fileInput.addEventListener('change', changeFileMockedFn)
          userEvent.upload(fileInput, new File(['(-(•̀ᵥᵥ•́)-)'], 'dracula.png', {type: 'image/png'}))
          expect(changeFileMockedFn).toHaveBeenCalled()
          const error = "Erreur 500"
          await waitFor(() => expect(console.error).toBeCalledWith(error))
        })
  })
})

//['500', '401', '400', '403', '412'].forEach(error => {
  //})
