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

<pre>
 <code id="htmlViewer" style="color:rgb(68, 68, 68); font-weight:400;background-color:rgb(240, 240, 240);background:rgb(240, 240, 240);display:block;padding: .5em;"><span style="color:rgb(136, 136, 136); font-weight:400;">// mocking the API</span>
jest.<span class="hljs-title function_">mock</span>(<span style="color:rgb(136, 0, 0); font-weight:400;">&quot;../app/store&quot;</span>, <span style="color:rgb(68, 68, 68); font-weight:400;">() =&gt;</span> mockStore)

<span style="color:rgb(136, 136, 136); font-weight:400;">// silencing console.error</span>
<span class="hljs-title function_">beforeAll</span>(<span style="color:rgb(68, 68, 68); font-weight:400;">()=&gt;</span>{
<span class="hljs-variable language_">console</span>.<span style="color:rgb(68, 68, 68); font-weight:400;">error</span> = jest.<span class="hljs-title function_">fn</span>(<span style="color:rgb(68, 68, 68); font-weight:400;">() =&gt;</span> {})
})

<span class="hljs-title function_">test</span>(<span style="color:rgb(136, 0, 0); font-weight:400;">&quot;An API call leading to a thrown 403 error should lead to such an error being printed to the console&quot;</span>, <span style="color:rgb(68, 68, 68); font-weight:700;">async</span> () =&gt; {
mockStore.<span style="color:rgb(68, 68, 68); font-weight:400;">bills</span> = jest.<span class="hljs-title function_">fn</span>(mockStore.<span style="color:rgb(68, 68, 68); font-weight:400;">bills</span>)
<span style="color:rgb(136, 136, 136); font-weight:400;">// next bills method call will be overridden to simulate a 403 error reply</span>
mockStore.<span style="color:rgb(68, 68, 68); font-weight:400;">bills</span>.<span class="hljs-title function_">mockImplementationOnce</span>(<span style="color:rgb(68, 68, 68); font-weight:400;">() =&gt;</span> {
<span style="color:rgb(68, 68, 68); font-weight:700;">return</span> {
create : <span style="color:rgb(68, 68, 68); font-weight:400;">() =&gt;</span> {
<span style="color:rgb(68, 68, 68); font-weight:700;">return</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span style="color:rgb(68, 68, 68); font-weight:700;">new</span> <span class="hljs-title class_">Error</span>(<span style="color:rgb(136, 0, 0); font-weight:400;">&quot;Erreur 403&quot;</span>))
}
}})
<span class="hljs-title class_">InitNewBillviaOnNavigate</span>()
<span style="color:rgb(68, 68, 68); font-weight:700;">const</span> fileInput = screen.<span class="hljs-title function_">getByTestId</span>(<span style="color:rgb(136, 0, 0); font-weight:400;">&#x27;file&#x27;</span>)
<span style="color:rgb(68, 68, 68); font-weight:700;">const</span> changeFileMockedFn = jest.<span class="hljs-title function_">fn</span>(newBillContainer.<span style="color:rgb(68, 68, 68); font-weight:400;">handleChangeFile</span>)
fileInput.<span class="hljs-title function_">addEventListener</span>(<span style="color:rgb(136, 0, 0); font-weight:400;">&#x27;change&#x27;</span>, changeFileMockedFn)
<span style="color:rgb(136, 136, 136); font-weight:400;">// associating a file with the dedicated form input &gt; which triggers the API POST request</span>
userEvent.<span class="hljs-title function_">upload</span>(fileInput, <span style="color:rgb(68, 68, 68); font-weight:700;">new</span> <span class="hljs-title class_">File</span>([<span style="color:rgb(136, 0, 0); font-weight:400;">&#x27;(-(•̀ᵥᵥ•́)-)&#x27;</span>], <span style="color:rgb(136, 0, 0); font-weight:400;">&#x27;dracula.png&#x27;</span>, {<span style="color:rgb(68, 68, 68); font-weight:400;">type</span>: <span style="color:rgb(136, 0, 0); font-weight:400;">&#x27;image/png&#x27;</span>}))
<span class="hljs-title function_">expect</span>(changeFileMockedFn).<span class="hljs-title function_">toHaveBeenCalled</span>()
<span style="color:rgb(68, 68, 68); font-weight:700;">const</span> expectedError = <span style="color:rgb(68, 68, 68); font-weight:700;">new</span> <span class="hljs-title class_">Error</span>(<span style="color:rgb(136, 0, 0); font-weight:400;">&quot;Erreur 403&quot;</span>)
<span style="color:rgb(136, 136, 136); font-weight:400;">// we expect console.error to be called with an instance of the error obj</span>
<span style="color:rgb(68, 68, 68); font-weight:700;">await</span> <span class="hljs-title function_">waitFor</span>(<span style="color:rgb(68, 68, 68); font-weight:400;">() =&gt;</span> <span class="hljs-title function_">expect</span>(<span class="hljs-variable language_">console</span>.<span style="color:rgb(68, 68, 68); font-weight:400;">error</span>).<span class="hljs-title function_">toBeCalledWith</span>(expectedError))
})</code></pre>
