'use strict'

var http = require('http')
var jade = require('jade')
var monk = require ('monk')
var url = require('url')

var newCat = jade.compileFile('./new.jade', {pretty: true})
var listCats = jade.compileFile('./listCat.jade', {pretty: true})
var editCat = jade.compileFile('./edit.jade', {pretty: true})

var db = monk('localhost/animals')

var catsCollection = db.get('cats')

function requestHandler(req, res){

  if (req.url == '/favicon.ico') {
      res.end();
      return;
    }
  
  var requestUrl = url.parse(req.url, true)
  
  var html = ""
  var formData = ''

  var routes = requestUrl.pathname.split('/')
  
  if (routes.length > 1){
    var route = routes[routes.length-1]
    
    if (route === 'cats')
    {
      catsCollection.find({}, function(err, catsDoc){
        html = listCats({cats: catsDoc})
        res.end(html)  
      })
      
    }
    else if (route === 'new')
    {
      html = newCat({})

      if (req.method === 'POST')
      { 
        req.on('data', function(data){
          formData += data
        })
        
        req.on('end', function(){
          //Insert into MongoDB
          var result= formData.split('&')
          var document = {}

          result.reduce(function(accumalator, keyValuePair){
            var pair = keyValuePair.split('=')
            accumalator[pair[0]]=pair[1]
            return accumalator
          },document)

          catsCollection.insert(document, function(err, doc){
            res.end(html)  
          })

                
        })
      }
      else
      { 
         res.end(html)  
      }

    }
    else if (route === 'edit')
    {
      var catId = routes[routes.length-2]  

      catsCollection.find({_id: catId}, function(err, catsDoc){
        
        html = editCat({cat: catsDoc})
        res.end(html)  
      })
      
    }
  }
}

var server  = http.createServer(requestHandler)

server.listen(3001)