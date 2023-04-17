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

// mocking the API<br>
jest.mock("../app/store", () => mockStore)<br>
<br>
// silencing console.error<br>
beforeAll(()=>{<br>
console.error = jest.fn(() => {})<br>
})<br>
<br>
test("An API call leading to a thrown 403 error should lead to such an error being printed to the console", async () => {<br>
mockStore.bills = jest.fn(mockStore.bills)<br>
// next bills method call will be overridden to simulate a 403 error reply<br>
mockStore.bills.mockImplementationOnce(() => {<br>
return {<br>
create : () => {<br>
return Promise.reject(new Error("Erreur 403"))<br>
}<br>
}})<br>
InitNewBillviaOnNavigate()<br>
const fileInput = screen.getByTestId('file')<br>
const changeFileMockedFn = jest.fn(newBillContainer.handleChangeFile)<br>
fileInput.addEventListener('change', changeFileMockedFn)<br>
// associating a file with the dedicated form input > which triggers the API POST request<br>
userEvent.upload(fileInput, new File(['(-(•̀ᵥᵥ•́)-)'], 'dracula.png', {type: 'image/png'}))<br>
expect(changeFileMockedFn).toHaveBeenCalled()<br>
const expectedError = new Error("Erreur 403")<br>
// we expect console.error to be called with an instance of the error obj<br>
await waitFor(() => expect(console.error).toBeCalledWith(expectedError))<br>
})
