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
import store from "../__mocks__/store.js";

import router from "../app/Router.js";

const fs = require('fs')
const bodytoTestFile = () => {
  fs.writeFile('../test.txt', document.body.innerHTML, err => { if (err) { console.error(err) } })
}

describe("Given I am connected as an employee", () => {

  describe("When I am on the Bills Page", () => {

    test("Then the bill icon, part of the vertical menu, should be highlighted", async () => {

        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        // rooter render all the views into a root div by default
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        // define window.onNavigate : app/router.js / onNavigate +-= window.history.pushState()
        router()
        // pushing billsUI into the vDOM
        window.onNavigate(ROUTES_PATH.Bills)
        await waitFor(() => screen.getByTestId('icon-window'))
        const windowIcon = screen.getByTestId('icon-window')
        // * to-do write expect expression
        // * unit test 1 
        // * solution :
        expect(windowIcon.classList.contains("active-icon")).toBeTruthy()
        //
    })

    test("Then all the bills tickets should be ordered from the latest to the earliest", () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
        const antiChrono = (a, b) => ((a < b) ? 1 : -1)
        const datesSorted = [...dates].sort(antiChrono)
        expect(dates).toEqual(datesSorted)
    })
    
    // * UNIT TEST / new bill button click / UI : employee dashboard / container/bill.js coverage line 11
    test("then clicking on the new bill button should display the new bill form", async () => { // async to be able to use await waitfor
        // onNavigate is a fn passed to every containers
        // so that they can force programmatically the navigation to other pages
        // the version below is simplified : only updating the documents body
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        // we need to instanciate the bill container to accces its methods for our test
        const billContainer = new Bills({ document, onNavigate, store: null, bills:bills, localStorage: window.localStorage })
        document.body.innerHTML = BillsUI({ data: bills }) // bills out of fixtures/bill.js
        const handleClickNewBillMockFn = jest.fn((e) => billContainer.handleClickNewBill())
        await waitFor(() => screen.getByTestId('btn-new-bill'))

        const newBillBtn = screen.getByTestId('btn-new-bill')
        newBillBtn.addEventListener('click', handleClickNewBillMockFn)
        userEvent.click(newBillBtn)
        
        // unit test ?
        expect(handleClickNewBillMockFn).toHaveBeenCalled()

        // integration test?
        await waitFor(() => screen.getByTestId('form-new-bill'))
        expect(screen.getByTestId("form-new-bill")).toBeInTheDocument()

    })

    // * UNIT TEST / icon eye button click / UI : employee dashboard / container/bill.js coverage line 23
    test("then clicking on the icon eye button should open a modale", async () => { 
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const billContainer = new Bills({ document, onNavigate, store: null, bills:bills, localStorage: window.localStorage })
        document.body.innerHTML = BillsUI({ data: bills })
        
        await waitFor(() => screen.getAllByTestId('icon-eye'))
        // select the first eye icon
        const iconEyeBtn = screen.getAllByTestId('icon-eye')[0]
        const handleClickIconEyeMockFn = jest.fn((e) => billContainer.handleClickIconEye(iconEyeBtn))
        iconEyeBtn.addEventListener('click', handleClickIconEyeMockFn)
        $.fn.modal = jest.fn() // mock bootstrap modale fn to avoid any error
        userEvent.click(iconEyeBtn)

        expect(handleClickIconEyeMockFn).toHaveBeenCalled()
        expect($.fn.modal).toHaveBeenCalledWith('show') 
    })

    // * UNIT TEST / we need to test the getbill() fn of the bill container / UI : employee dashboard / container/bill.js coverage line 30
    // function ccalled into app/router.js
    test("then passing a mocked store containing 4 bills should lead to 4 bills being displayed", async () => { 
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const mockedStore = store
      const billContainer = new Bills({ document, onNavigate, store: mockedStore, localStorage: window.localStorage }) // passing the mocked store instead of bills

      // unit test ?
      expect((await billContainer.getBills()).length).toBe(4)

      document.body.innerHTML = BillsUI({data : await billContainer.getBills()}) // passed as data
      // integration test ?
      await waitFor(() => screen.getAllByTestId('icon-eye'))
      expect(screen.getAllByTestId('icon-eye').length).toBe(4)
    })


  })
})
