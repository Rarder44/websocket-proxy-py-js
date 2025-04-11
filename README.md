# websocket-proxy-py-js
a proxy written in python with the purpose of receiving requests from a js client via websocket


for the English translation, see [here](https://www.youtube.com/watch?v=dQw4w9WgXcQ) and [here](https://translate.google.com/)


-----------

lo scopo è quello di creare un proxy che permetta ad un client js ( browser ) di richiedere una pagina tramite websocket.


### server

ascolta su localhost:8765 ( configurabile ) e gestisce le richeiste da parte del client

**NOTA:** non è stata implementata nessuna funzionalità di sessione!

<br />


### client

una volta definita la classe basta inizializzare l'istanza con 
```js
new WSProxy("ws://localhost:8765");
```

consiglio di tenere l'instanza direttamente in una variabile globale in window

```js
window.proxy = new WSProxy("ws://localhost:8765");
```

anche se dovrebbe essere possibile istanziare più istanze in contemporanea, questa funzione non è stata testata.


------

## Funzionalità implementate

- recuperare il contenuto di una pagina o file 
```js
let response = await window.proxy.fetch("https://example.com/");
let response = await window.proxy.fetch("https://example.txt/");
```
- lanciare il download (browser) direttamente di un file 
```js
await window.proxy.download("https://example.com/file.pdf");
```
- injectare un js esterno nel document corrente ( browser )
```js
await window.proxy.injectJS("https://example.com/script.js");
```

---


struttura richieste al server
```json
{ 
    url:"",     
    method:"GET"|"POST",    
    params:{},  //get data
    data:{},          //post data               
    outAsArrayBuffer = true | false //specifica se la richiesta dovrà poi essere
                                    //resitutita come ArrayBuffer o stringa
}
```



struttura rispota dal server
```json
{
    "status": 200, //codice HTTP della risposta ricevuta dal proxy
    "headers": "", //header della risposta
    "body": "" | ArrayBuffer, //risposta ricevuta dal proxy
    "is_base64": true,  // specifica se il body è base64 o no 
                        // ( dovrebbe esserlo sempre 
}
```


