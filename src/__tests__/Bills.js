/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import '@testing-library/jest-dom' // .toBeInTheDocument() matcher
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";

const fs = require('fs')
const bodytoTestFile = () => {
  fs.writeFile('../test.txt', document.body.innerHTML, err => { if (err) { console.error(err) } })
}

let billContainer

// init local storage
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

// * this Init Fn gives no access to the billContainer methods
function InitBillviaOnNavigate() {
  // rooter render all the views into a root div by default
  document.body.innerHTML = "<div id='root'></div>"
  // define window.onNavigate : app/router.js / onNavigate +-= window.history.pushState()
  router()
  // pushing billsUI into the vDOM
  window.onNavigate(ROUTES_PATH.Bills)
}

// * this Init Fn gives access to the billContainer methods, which are sometimes mandatory to a achieve some specific tests
function InitWithABillInstance() { 
  // onNavigate needs to be passed as a parameter to instanciate a container
  // onNavigate allows programmatic navigation
  document.body.innerHTML = BillsUI({ data: bills }) // bills out of fixtures/bill.js
  billContainer = new Bills({ document, onNavigate : jest.fn, store: null, localStorage: window.localStorage })
}


describe("Given I am connected as an employee", () => {
  describe("When I am on the Bills Page", () => {
    test("Then the window icon in the vertical nav bar should be the only one highlighted", async () => {
        InitBillviaOnNavigate()
        await waitFor(() => screen.getByTestId('icon-window'))
        const windowIcon = screen.getByTestId('icon-window')
        // * TODO : composant views/Bills : Le taux de couverture est à 100% néanmoins si tu regardes le premier test il manque la mention “expect”. 
        // * Ajoute cette mention pour que le test vérifie bien ce que l’on attend de lui.  
        // * solution :
        expect(windowIcon.classList.contains("active-icon")).toBeTruthy()
        expect(screen.getByTestId('icon-mail').classList.contains("active-icon")).toBeFalsy()
        //
    })


    test("Then all the bills tickets should be ordered from the latest to the earliest", () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
        const antiChrono = (a, b) => ((a < b) ? 1 : -1)
        const datesSorted = [...dates].sort(antiChrono)
        expect(dates).toEqual(datesSorted)
    })

    
    // * UNIT TEST : clicking the "new bill" button
    // * UI : employee bills page & newBills page
    // * COVERAGE : container/bill.js => Lines : 19-21
    // async to have access to the waitFor fn
    test("then clicking on the 'new bill' button should display the 'new bill' form", async () => { 
        // onNavigate necessary on this specific test since there is a programmatic navigation from BillsUI to NewBillUI
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        // instanciate the bill container to get access to the handleClickNewBill method
        document.body.innerHTML = BillsUI({ data: bills }) // bills out of fixtures/bill.js
        const billContainer = new Bills({ document, onNavigate, store: null, bills:bills, localStorage: window.localStorage })
        // wait for the UI to populate the vDOM
        await waitFor(() => screen.getByTestId('btn-new-bill'))
        // setup to monitor any left click of the "new bill" button
        // billContainer.handleClickNewBill accessible thanks to the billContainer instanciation
        const handleClickNewBillMockFn = jest.fn(billContainer.handleClickNewBill)
        const newBillBtn = screen.getByTestId('btn-new-bill')
        newBillBtn.addEventListener('click', handleClickNewBillMockFn)
        userEvent.click(newBillBtn)
        // has the function linked to the button been called ?
        expect(handleClickNewBillMockFn).toHaveBeenCalled()
        await waitFor(() => screen.getByTestId('form-new-bill'))
        // is the form being displayed ?
        expect(screen.getByTestId("form-new-bill")).toBeInTheDocument()
    })


    // * UNIT TEST : clicking the "icon eye" button 
    // * UI : employee bills page
    // * COVERAGE : container/bill.js => Lines : 23-27
    test("then clicking on the icon eye button should open a modale", async () => { 
        InitWithABillInstance()
        await waitFor(() => screen.getAllByTestId('icon-eye'))
        // select the first "icon eye" button
        const iconEyeBtn = screen.getAllByTestId('icon-eye')[0]
        const handleClickIconEyeMockFn = jest.fn((e) => billContainer.handleClickIconEye(iconEyeBtn))
        iconEyeBtn.addEventListener('click', handleClickIconEyeMockFn)
        $.fn.modal = jest.fn(() => {}) // empty mock bootstrap modal fn to avoid any error
        userEvent.click(iconEyeBtn)
        expect(handleClickIconEyeMockFn).toHaveBeenCalled()
        expect($.fn.modal).toHaveBeenCalledWith('show') 
    })


    // * UNIT TEST : checking if billsContainer.getBills() can process some mockedStore bills with no alteration
    // * UI : employee bills page
    // * COVERAGE : container/bill.js => Lines 30-56 minus the catch statement
    // function called into app/router.js
    test("then passing our mockedStore to the bills container should lead to .getbills() returning an array of 4 expected elements", async () => { 
      // passing the mocked store instead of bills
      const billContainer = new Bills({ document, onNavigate : jest.fn, store: {...mockStore}, localStorage: window.localStorage }) 
      // 4 bills IN : MockedStore vs 4 bills OUT : billContainer.getbills()
      expect((await billContainer.getBills()).length).toBe(4)
      // besides the date property bills IN should be equal to bills OUT
      // Set because IN & OUT bills are ordered in a different way => Number of bills tested right before, so no risk of getting rid of a duplicate bill
      expect(new Set(await billContainer.getBills()).forEach(bill => bill.date = "")).toEqual(new Set(bills).forEach(bill => bill.date = ""))
    })


    // * UNIT TEST : can the billContainer deal with an invalid date within some bills?
    // * UI : employee bills page 
    // * COVERAGE : container/bill.js => The catch statement that wasn't tested through the previous test
    test("then passing a mocked store containing one invalid date should lead to an invalid date being displayed into the bills table", async () => { 

      const mockedBill = {
        list() {
          return Promise.resolve([{
            "id": "47qAXb6fIm2zOKkLzMro",
            "vat": "80",
            "fileUrl": "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
            "status": "pending",
            "type": "Hôtel et logement",
            "commentary": "séminaire billed",
            "name": "encore",
            "fileName": "preview-facture-free-201801-pdf-1.jpg",
            "date": "xxxx/xx/xx", // invalid date inserted on purpose
            "amount": 400,
            "commentAdmin": "ok",
            "email": "a@a",
            "pct": 20
          }])}
      }

      const mockedStore = {
        bills() {
        return {...mockedBill}
      },}

      // passing the mocked store instead of the mocked bills
      const billContainer = new Bills({ document, onNavigate : jest.fn, store: mockedStore, localStorage: window.localStorage })

      expect((await billContainer.getBills())[0].date).toBe('xxxx/xx/xx')
      
      // !!! integration test ?
      document.body.innerHTML = BillsUI({data : await billContainer.getBills()})
      await waitFor(() => screen.getAllByTestId('icon-eye'))
      expect(screen.getByText('xxxx/xx/xx')).toBeInTheDocument()
    })

  })
})


// INTEGRATION TESTS : interactions GET request to API > Bills > BillsUI

jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on the Bills Page", () => {
    test("Then a succesfull fetch should lead to 4 specific bills being displayed", async () => {
      InitBillviaOnNavigate()
      await waitFor(() => screen.getAllByTestId('icon-eye'))
      // 4 bills in the mocked store > 4 expected bills names & 4 eyes icons into the bills table
      expect(screen.getByText('encore')).toBeInTheDocument() 
      expect(screen.getByText('test1')).toBeInTheDocument()
      expect(screen.getByText('test2')).toBeInTheDocument()
      expect(screen.getByText('test3')).toBeInTheDocument()
      expect(screen.getAllByTestId('icon-eye').length).toBe(4)
    })

    test("Then an API call returning a 404 error should display a 404 error message", async () => {
      // jest.spyOn(mockStore, "bills")
      mockStore.bills = jest.fn(mockStore.bills)
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
      }})
      InitBillviaOnNavigate()
      expect(await waitFor(() => screen.getByText(/Erreur 404/))).toBeInTheDocument()
    })

    test("Then an API call returning a 500 error should display a 500 error message", async () => {
      mockStore.bills = jest.fn(mockStore.bills)
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
      }})
      InitBillviaOnNavigate()
      expect(await waitFor(() => screen.getByText(/Erreur 500/))).toBeInTheDocument()
    })

  })

})