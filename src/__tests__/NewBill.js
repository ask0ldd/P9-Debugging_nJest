/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the new bill page and its form should be displayed", () => {
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
        window.onNavigate(ROUTES_PATH.NewBill)
        expect(screen.getByText('Envoyer une note de frais')).toBeTruthy()
        expect(screen.getByText('Type de dépense')).toBeTruthy()
        expect(screen.getByText('Nom de la dépense')).toBeTruthy()
        expect(screen.getByText('Date')).toBeTruthy()
        expect(screen.getByText('Montant TTC')).toBeTruthy()
        expect(screen.getByText('TVA')).toBeTruthy()
        expect(screen.getByText('Commentaire')).toBeTruthy()
        expect(screen.getByText('Justificatif')).toBeTruthy()
    })
  })
})
