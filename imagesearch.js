var express = require('express');
var app = express();
var request = require('request');
var mongo = require('mongodb').MongoClient;
var moment = require('moment-timezone');
var stylus = require('stylus');
var path = require('path');
var jade = require('jade');

var url = 'mongodb://localhost:27017/searchinfo'

var apikey = 'AIzaSyAVTTyH5Ajs5LqBtYADhjaewe63hFuvP48';
var cseid = '007708670434218213495:zr3nv-lduv0';

// call to the homepage
app.use(stylus.middleware(path.join(__dirname,'/public/css')));
app.use(express.static('public'));

// call to response page
app.set('view engine', 'jade')
app.set('views', path.join(__dirname, '/public'));

// adds a search entry to the mongodb database
function addEntry(search) {
mongo.connect(url, function(err, db) {
    if (err) throw err;
    db.createCollection('searches'); // creates collection or ignores if already exists
    var searches = db.collection('searches');
    searches.insert({
        search: search
    }, function(err,data) {
        if (err) throw err;
        db.close();
    });
});  
}

// return the most recent search queries
app.get('/api/imagesearch/latest/',function(req,res) {
    var howmany = 10;
    mongo.connect(url,function(err,db){
       if (err) throw err;
       var searches = db.collection('searches');
       searches.find({},{
           search: 1,
           _id: 0
       }).toArray(function(err,docs) {
          if (err) throw err;
          if (howmany>docs.length) {
              howmany = docs.length;
          }
          var last = docs.slice(docs.length-howmany,docs.length);
          res.send(last.reverse());
       });
    });
});

/*
app.get('/test/',function(req,res){
   var r = [{"link":"http://1.bp.blogspot.com/_6qy_k8kbw6M/SS5kfnpGOvI/AAAAAAAAABg/h_E-MQ_81Ak/s1600-h/ATT2490461.jpg","snippet":"locats","image":{"contextLink":"http://nomads-blog1.blogspot.com/2008/11/locats.html"}},{"link":"http://www.defenceweb.co.za/images/stories/AIR/Air_new/locats_400x300.jpg","snippet":"systems (LOCATS) flying.","image":{"contextLink":"http://www.defenceweb.co.za/index.php?option=com_content&view=article&id=9273:locats-kept-flying&catid=35:Aerospace&Itemid=107"}},{"link":"http://3.bp.blogspot.com/_6qy_k8kbw6M/SS5kff2NylI/AAAAAAAAABI/o3F1nKt4fzY/s1600-h/ar118842020530229.jpg","snippet":"locats. these are lol cats","image":{"contextLink":"http://nomads-blog1.blogspot.com/2008/11/locats.html"}},{"link":"https://i.ytimg.com/vi/m6U186_jjVo/maxresdefault.jpg","snippet":"Serge Locat (Harmonium) sera","image":{"contextLink":"https://www.youtube.com/watch?v=m6U186_jjVo"}},{"link":"http://3.bp.blogspot.com/_6qy_k8kbw6M/SS5kfRgR8II/AAAAAAAAABY/9ilJ6X1kkec/s1600-h/allinfavorof128521852188758922.jpg","snippet":"locats. these are lol cats","image":{"contextLink":"http://nomads-blog1.blogspot.com/2008/11/locats.html"}},{"link":"https://i.ytimg.com/vi/m6U186_jjVo/hqdefault.jpg","snippet":"Serge Locat (Harmonium) sera","image":{"contextLink":"https://www.youtube.com/watch?v=m6U186_jjVo"}},{"link":"http://www.usinenouvelle.com/industry/img/c-a-locat-n-cable-and-metal-pipe-detector-000279141-4.jpg","snippet":"C.A 6681 LOCAT-N cable and","image":{"contextLink":"http://www.usinenouvelle.com/industry/chauvin-arnoux-2190/c-a-locat-n-cable-and-metal-pipe-detector-p225255.html"}},{"link":"https://i.ytimg.com/vi/1sFM0N7bZgs/hqdefault.jpg","snippet":"Serge Locat - Le crieur -","image":{"contextLink":"https://www.youtube.com/watch?v=1sFM0N7bZgs"}},{"link":"https://s-media-cache-ak0.pinimg.com/564x/56/bd/78/56bd78c36ca49a6ab993de82e1813c96.jpg","snippet":"LO: Cats, Animals, Kitten,","image":{"contextLink":"https://www.pinterest.com/pin/501166264763056763/"}},{"link":"https://i.ytimg.com/vi/EXV79I4nigk/hqdefault.jpg","snippet":"Maude Locat Ol'Blue Eyes Vidéo","image":{"contextLink":"https://www.youtube.com/user/olblueeyesproduction"}}]; 
   res.render('response',{results: r});
});
*/


// search for the string entered by the user with the query parameters and add 
// the entry to the database if valid
app.get('/api/imagesearch/*', function(req, res) {
    var q = req.params['0']; 
    var offset = JSON.stringify(req.query['offset']);
    var start = 1;
    if (offset !== undefined) {
        start = offset.replace(/"/g,"");
    }
    var url = 'https://www.googleapis.com/customsearch/v1?key=' + apikey + '&cx=' + cseid + '&q=' + q + '&num=10&start=' + start + '&searchType=image&fields=items(link,snippet,image(contextLink))';
    request({
        uri: url,
        json: true
    }, function(error, response, body) {
        if (!error && response.statusCode == 200 && body.items !== undefined) {
            res.render('response',{results: body.items});
            var m = moment().tz("America/New_York").format('MMMM Do YYYY, h:mm:ss a');
            var search = {
                searchString:q,
                time: m
            }
            addEntry(search); // adds entry to database
        }
        else {
            res.send('404 warning: Invalid search string');
        }
    });
});


app.listen(process.env.PORT);
