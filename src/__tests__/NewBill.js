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
import { ROUTES_PATH } from "../constants/routes.js";
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

    // * UNIT TEST : the form and the named input should be present on the newbill page
    // * UI : employee newBill page 
    // * COVERAGE : container/newBill.js => line 4-16
    test("Then the page and its form should be displayed", async () => {
        await waitFor(() => screen.getByTestId('form-new-bill'))
        expect(screen.getByTestId('form-new-bill')).toBeInTheDocument()
        expect(document.body.querySelector('#btn-send-bill')).toBeInTheDocument()
        expect(screen.getByTestId('expense-type')).toBeInTheDocument()
        expect(screen.getByTestId('expense-name')).toBeInTheDocument()
        expect(screen.getByTestId('datepicker')).toBeInTheDocument()
        expect(screen.getByTestId('amount')).toBeInTheDocument()
        expect(screen.getByTestId('vat')).toBeInTheDocument()
        expect(screen.getByTestId('pct')).toBeInTheDocument()
        expect(screen.getByTestId('commentary')).toBeInTheDocument()
        expect(screen.getByTestId('file')).toBeInTheDocument()
    })

    // * UNIT TEST : the mail icon should be the only active icon within the nav bar
    // * UI : employee newBill page 
    // * COVERAGE : container/newBill.js
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

    // * UNIT TEST : An invalid file shouldn't be added to the form or trigger a new bill creation call to the server
    // * UI : employee newBill page 
    // * COVERAGE : container/newBill.js => line 20-29
    test("Then an invalid file can't be successfully added to the form or trigger a new bill creation call to the server", async () => {
      await waitFor(() => screen.getByTestId('form-new-bill'))
      const fileInput = screen.getByTestId('file')
      const file = new File(['hello'], 'https://localhost:3456/images/test.zzz', {type: 'image/zzz'})
      // const event = { preventDefault: () => {}, target:{ value : 'https://localhost:3456/images/test.zzz', files:{ 0 : file}}}
      const changeFileMockedFn = jest.fn(newBillContainer.handleChangeFile)
      newBillContainer.store.bills().create = jest.fn(newBillContainer.store.bills().create)
      fileInput.addEventListener('change', () => changeFileMockedFn) // for integration test
      userEvent.upload(fileInput, file)
      expect(fileInput.value).toBe("")
      expect(fileInput.files).toStrictEqual([])
      expect(newBillContainer.store.bills().create).not.toHaveBeenCalled()
    })


    // * UNIT TEST : Selecting a valid file should lead to a new bill creation call to the server
    // * UI : employee newBill page 
    // * COVERAGE : container/newBill.js => line 20-51
    test("Then a valid file can successfully be added to the form & trigger a new bill creation call to the server", async () => {
        await waitFor(() => screen.getByTestId('form-new-bill'))
        const fileInput = screen.getByTestId('file')
        // NB : Create Bill request is called within handlechangefile
        const changeFileMockedFn = jest.fn(newBillContainer.handleChangeFile)
        newBillContainer.store.bills().create = jest.fn(newBillContainer.store.bills().create)
        fileInput.addEventListener('change', changeFileMockedFn)
        userEvent.upload(fileInput, new File(['(-(•̀ᵥᵥ•́)-)'], 'dracula.png', {type: 'image/png'}))
        expect(changeFileMockedFn).toHaveBeenCalled()
        expect(fileInput.files.length).toEqual(1)
        expect(newBillContainer.store.bills().create).toHaveBeenCalled()
    })


    // * UNIT TEST : The submission of a form with an invalid file should trigger an alert with a "type de fichier invalide" message
    // * UI : employee newBill page 
    // * COVERAGE : container/newBill.js => line 75-77
    test("then a 'type de fichier invalide' alert should be triggered when an invalid file is submitted with the new bill form", async () => {
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
        // NB : https://github.com/testing-library/react-testing-library/issues/624
        // = no way for jest to catch an error thrown through the triggering of an event
    })


    // * UNIT TEST : Clicking the submit button with a valid form should trigger an update bill call to the server
    // * UI : employee newBill page 
    // * COVERAGE : container/newBill.js => line 56-82
    test("then the API should be called for an update when a valid form is submitted", async () => {
      await waitFor(() => screen.getByTestId('form-new-bill'))
      const fileInput = screen.getByTestId('file')
      // add a file to the form & call for a new bill creation
      userEvent.upload(fileInput, new File(['(-(•̀ᵥᵥ•́)-)'], 'dracula.png', {type: 'image/png'}))
      await waitFor(() => expect(newBillContainer.billId).toBe('1234'))
      expect(newBillContainer.fileName).toBe('dracula.png')
      fillForm()
      // SOUTENANCE : defining a custom event which will be passed to handleSubmit
      const event = { preventDefault: () => {}, target:{querySelector : () => document.querySelector}}
      const formNewBill = screen.getByTestId('form-new-bill')
      const clickSubmitNewBillMockedFn = jest.fn(newBillContainer.handleSubmit)
      formNewBill.addEventListener('submit', () => clickSubmitNewBillMockedFn(event))
      const sendNewBillBtn = document.body.querySelector("#btn-send-bill")
      newBillContainer.updateBill = jest.fn(newBillContainer.updateBill)
      userEvent.click(sendNewBillBtn)
      expect(clickSubmitNewBillMockedFn).toHaveBeenCalled()
      expect(newBillContainer.updateBill).toHaveBeenCalled()
    })
  })
})

// INTEGRATION TESTS : interactions POST
jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on the Bills Page", () => {

    beforeAll(()=>{ 
      // jest.spyOn(console, "error")
      console.error = jest.fn(() => {})
    })

    // 201 (Success)
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

    // 500 (Internal Server Error)
    test("Then an API call failing with a 500 error should console.error a 500 error message", async () => {
      mockStore.bills = jest.fn(mockStore.bills)
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })
      InitNewBillviaOnNavigate()
      const fileInput = screen.getByTestId('file')
      const changeFileMockedFn = jest.fn(newBillContainer.handleChangeFile)
      fileInput.addEventListener('change', changeFileMockedFn)
      userEvent.upload(fileInput, new File(['(-(•̀ᵥᵥ•́)-)'], 'dracula.png', {type: 'image/png'}))
      expect(changeFileMockedFn).toHaveBeenCalled()
      const expectedError = new Error("Erreur 500")
      await waitFor(() => expect(console.error).toBeCalledWith(expectedError))
    })

    // 400 (Bad Request)
    test("Then an API call failing with a 400 error should console.error a 400 error message", async () => {
      mockStore.bills = jest.fn(mockStore.bills)
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create : () =>  {
            return Promise.reject(new Error("Erreur 400"))
          }
      }})
      InitNewBillviaOnNavigate()
      const fileInput = screen.getByTestId('file')
      const changeFileMockedFn = jest.fn(newBillContainer.handleChangeFile)
      fileInput.addEventListener('change', changeFileMockedFn)
      userEvent.upload(fileInput, new File(['(-(•̀ᵥᵥ•́)-)'], 'dracula.png', {type: 'image/png'}))
      expect(changeFileMockedFn).toHaveBeenCalled()
      const expectedError = new Error("Erreur 400")
      await waitFor(() => expect(console.error).toBeCalledWith(expectedError))
    })

    // 401 (Unauthorized)
    test("Then an API call failing with a 401 error should console.error a 401 error message", async () => {
      mockStore.bills = jest.fn(mockStore.bills)
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create : () =>  {
            return Promise.reject(new Error("Erreur 401"))
          }
      }})
      InitNewBillviaOnNavigate()
      const fileInput = screen.getByTestId('file')
      const changeFileMockedFn = jest.fn(newBillContainer.handleChangeFile)
      fileInput.addEventListener('change', changeFileMockedFn)
      userEvent.upload(fileInput, new File(['(-(•̀ᵥᵥ•́)-)'], 'dracula.png', {type: 'image/png'}))
      expect(changeFileMockedFn).toHaveBeenCalled()
      const expectedError = new Error("Erreur 401")
      await waitFor(() => expect(console.error).toBeCalledWith(expectedError))
    })

    // 403 (Forbidden)
    test("Then an API call failing with a 403 error should console.error a 403 error message", async () => {
      mockStore.bills = jest.fn(mockStore.bills)
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create : () =>  {
            return Promise.reject(new Error("Erreur 403"))
          }
      }})
      InitNewBillviaOnNavigate()
      const fileInput = screen.getByTestId('file')
      const changeFileMockedFn = jest.fn(newBillContainer.handleChangeFile)
      fileInput.addEventListener('change', changeFileMockedFn)
      userEvent.upload(fileInput, new File(['(-(•̀ᵥᵥ•́)-)'], 'dracula.png', {type: 'image/png'}))
      expect(changeFileMockedFn).toHaveBeenCalled()
      const expectedError = new Error("Erreur 403")
      await waitFor(() => expect(console.error).toBeCalledWith(expectedError))
    })

  })
})
