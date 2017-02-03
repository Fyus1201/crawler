/**
 * Created by Fyus on 2017/1/25.
 */
var http = require("http"),
    url = require("url"),
    fs = require('fs'),
    path = require('path'),//路径
    async = require("async"),//异步
    superagent = require("superagent"),//轻量的的 http 方面的库，是nodejs里一个非常方便的客户端请求代理模块
    cheerio = require("cheerio"),// Node.js 版的 jquery。适合各种Web爬虫程序。
    eventproxy = require("eventproxy");//控制并发

var ep = new eventproxy();
var firstGet = "https://movie.douban.com/j/search_subjects?type=movie&tag=%E7%83%AD%E9%97%A8&sort=recommend&page_limit=20&page_start=";
var urlSun = 15;
var get_array = [];
var movie_array = [];
var movie_imgANDtitle = [];
var movie_url = [];
var movie_urlImg = [];

//https://movie.douban.com/j/search_subjects?type=movie&tag=%E7%83%AD%E9%97%A8&sort=recommend&page_limit=20&page_start=20

for(var i=0 ; i<= urlSun ; i++){
    get_array.push(firstGet + i*20);
}

var donwnImg = function (imgHttp,title) {


    var imgName = path.basename(imgHttp);

    console.log("图片名字"+imgName);
    console.log("图片地址1:   "+ imgHttp,title);
    //var title = itemDetail.children('ul').eq(0);
    //var titleLength = itemDetail.children('ul').length;
    //console.log("分类:   "+titleLength);
    //下载
    superagent.get(imgHttp).end(function(err,sres){

        if(err){
            console.log(err);
            throw("失败图片地址："+imgHttp);
        }else {
            //根据访问路径获得文件名称
            var path = './内容/'+ title + '/' ;
            var imgPath = path +title+'_'+imgName;

            var path_exists = fs.existsSync(path);
            if(path_exists === true){
                console.log("存在目录:" + title);
                fs.writeFile(imgPath,sres.body,function(err){
                    if (err) {
                        return console.error(err);
                    }
                    console.log('已成功抓取:' + path);
                });
            }else {
                console.log("没有目录创建目录:" + title);
                fs.mkdir(path,function(err){
                    if (err) {
                        return console.error(err);
                    }
                    console.log("目录创建成功。");
                    fs.writeFile(imgPath,sres.body,function(err){
                        if (err) {
                            return console.error(err);
                        }
                        console.log('已成功抓取:' + path);
                    });
                });
            }
        }

    });
};

// 主start程序
function start(){

    var onRequest = function (request, response) {

        response.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});

        ep.after('movieHtmlEvent',get_array.length*20,function (urls) {
            //控制并发数
            var curCount = 0;
            var getMovie = function (url, callback) {
                var delay = parseInt((Math.random() * 30000000) % 1000, 10);
                curCount++;

                superagent.get(url)
                    .end(function (err,pres) {
                        if (err) {
                            console.log("信息读取失败"+err);
                        }else {

                            var $ = cheerio.load(pres.text);
                            // console.log("内页图片"+$("#mainpic").find("img").attr('src') );
                            var url_img = $("#mainpic").find("img").attr('src');
                            console.log("添加图片" + url_img);
                            movie_urlImg.push(url_img);

                        }
                    });

                setTimeout(function (url) {
                    curCount--;
                    callback(null,url +'Call back content');
                },delay);
            };

            async.mapLimit(urls,2,
                function (url, callback) {
                    getMovie(url, callback);
                },
                function (err,result) {
                    console.log("******完成网页抓取*******");
                    console.log("\n准备抓取内页图片\n");

                    function getEvents() {

                        if(get_array.length*20 === movie_urlImg.length){
                            console.log("读取json完成" + movie_urlImg.length);
                            movie_urlImg.forEach(
                                function (subject) {

                                    ep.emit('img_urlHtmlEvent',{'img':subject,'title':"aaaa内页aaaa"});
                                }
                            )
                        }else {
                            console.log("读取json未完成" + movie_urlImg.length);
                            setTimeout(getEvents, 500);//node环境下使用eval方法 只能在非严格模式中进行使用，在use strict中是不允许使用这个方法的。
                        }
                    }
                    getEvents();//判断是否完成

                })

        });

        ep.after('img_urlHtmlEvent',get_array.length*20,function (urlANDtitles) {
            //控制并发数
            console.log("out:"+urlANDtitles[0].title);

            var curCount = 0;

            var getImg = function (urlANDtitle, callback) {
                var delay = parseInt((Math.random() * 30000000) % 1000, 10);
                curCount++;

                let img = urlANDtitle.img;
                let title = urlANDtitle.title;

                donwnImg(img,title);

                setTimeout(function (url) {
                    curCount--;
                    callback(null,url +'Call back content');
                },delay);
            };

            async.mapLimit(urlANDtitles,2,
                function (urlANDtitle, callback) {
                    getImg(urlANDtitle, callback);
                },
                function (err,result) {
                    console.log("******完成图片抓取*******");
                })

        });

        ep.after('imgHtmlEvent',get_array.length*20,function (urlANDtitles) {
            //控制并发数
            console.log("out:"+urlANDtitles[0].title);

            var curCount = 0;

            var getImg = function (urlANDtitle, callback) {
                var delay = parseInt((Math.random() * 30000000) % 1000, 10);
                curCount++;

                let img = urlANDtitle.img;
                let title = urlANDtitle.title;

                donwnImg(img,title);

                setTimeout(function (url) {
                    curCount--;
                    callback(null,url +'Call back content');
                },delay);
            };

            async.mapLimit(urlANDtitles,2,
                function (urlANDtitle, callback) {
                    getImg(urlANDtitle, callback);
                },
                function (err,result) {
                    console.log("******完成图片抓取*******");
                })

        });



        //控制并发数
        var curCount = 0;
        console.log("*****出动*****\n");
        var getJson = function (get_url,callback) {
            var delay = parseInt((Math.random() * 30000000) % 1000, 10);
            curCount++;
            console.log("读取json信息" + get_url + "当前并发数：" + curCount);
            superagent.get(get_url)
                .end(function (err,pres) {
                    if (err) {
                        console.log("ajax地址读取失败"+err);
                    }else {

                        //var $ = cheerio.load(pres.text);
                        var movie_json = JSON.parse(pres.text);

                        if(movie_json.subjects.length  === 0){
                            console.log("***********当前为0*********** \n" + get_url + "\n" + "*******当前超出范围********");
                        }
                        movie_array = movie_array.concat( movie_json.subjects );
                        response.write( '读取' + get_url +' successful<br/>' + "\n当前：" + movie_array.length);

                    }
                });

            setTimeout(function (get_url) {
                curCount--;
                callback(null,get_url +'Call back content');
            },delay);
        };

        async.mapLimit(get_array,5,
            function (get_url,callback) {

                getJson(get_url,callback);

            },function (err,result) {

                function getEvents() {

                    if(get_array.length*20 === movie_array.length){
                        console.log("读取json完成" + movie_array.length);
                        movie_array.forEach(
                            function (subject) {

                                ep.emit('imgHtmlEvent',{'img':subject.cover,'title':subject.title});
                                ep.emit('movieHtmlEvent',subject.url);
                            }
                        )
                    }else {
                        console.log("读取json未完成" + movie_array.length);
                        setTimeout(getEvents, 500)//node环境下使用eval方法 只能在非严格模式中进行使用，在use strict中是不允许使用这个方法的。
                    }
                }
                getEvents();//判断是否完成


                // var int=setInterval(function(){console.log(2);},100);
                //
                // setTimeout(function () {
                //     console.log("dfds");
                //     int=clearInterval(int)
                // }, 2000);

            });
    };

    http.createServer(onRequest).listen(3000);
}
// 控制台会输出以下信息
console.log('Server running at http://127.0.0.1:3000/');

exports.start= start;