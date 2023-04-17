This app is meant to give some employees a way to manage the expense reports of a company.

Besides a few bugs I had to handle, the backend and the frontend were delivered to me as is.

My job here consisted of implementing all the tests needed to assess the behavior of the employee dashboard functionalities.

Using Jest I had to deal with :

- Rejected promises,
- Thrown errors,
- Some complex routing,
- A mocked API,
- A mocked localStorage,
- ...

It wasn't an easy task since I did my best to stick to the user workflow (which adds a lot of complexity to the process) despite the lack of online documentation to help you tackle .

One of the most interesting test has to be that one :

// mocking the API
jest.mock("../app/store", () => mockStore)

// silencing console.error
beforeAll(()=>{
console.error = jest.fn(() => {})
})

test("An API call leading to a thrown 403 error should lead to such an error being printed to the console", async () => {
mockStore.bills = jest.fn(mockStore.bills)
// next bills method call will be overridden to simulate a 403 error reply
mockStore.bills.mockImplementationOnce(() => {
return {
create : () => {
return Promise.reject(new Error("Erreur 403"))
}
}})
InitNewBillviaOnNavigate()
const fileInput = screen.getByTestId('file')
const changeFileMockedFn = jest.fn(newBillContainer.handleChangeFile)
fileInput.addEventListener('change', changeFileMockedFn)
// associating a file with the dedicated form input > which triggers the API POST request
userEvent.upload(fileInput, new File(['(-(•̀ᵥᵥ•́)-)'], 'dracula.png', {type: 'image/png'}))
expect(changeFileMockedFn).toHaveBeenCalled()
const expectedError = new Error("Erreur 403")
// we expect console.error to be called with an instance of the error obj
await waitFor(() => expect(console.error).toBeCalledWith(expectedError))
})
