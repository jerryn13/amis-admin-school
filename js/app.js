var myapihost='https://api.school.ledotec.cn';
var g_isRefreshingAK=false;
var apiErrorCounter=0;

function ready(){
    let amis = amisRequire('amis/embed');
    const match = amisRequire('path-to-regexp').match;

    // 如果想用 browserHistory 请切换下这处代码, 其他不用变
    // const history = History.createBrowserHistory();
    const history = History.createHashHistory();

    const app = {
      type: 'app',
      brandName: '桂圆云校',
      logo: 'https://s1.ledotec.cn/webfront/ooischool/static/web/appicon.png',
      //header: {
      //  type: 'tpl',
      //  inline: false,
      //  className: 'w-full'
        //,
        //tpl: '<div class="flex justify-between"><div>顶部区域左侧</div><div>顶部区域右侧</div></div>'
      //},
      // footer: '<div class="p-2 text-center bg-light">底部区域</div>',
      // asideBefore: '<div class="p-2 text-center">菜单前面区域</div>',
      // asideAfter: '<div class="p-2 text-center">菜单后面区域</div>',
      api: '/pages/site_admin_1.json'
    };
    
    function normalizeLink(to, location = history.location) {
      to = to || '';

      if (to && to[0] === '#') {
        to = location.pathname + location.search + to;
      } else if (to && to[0] === '?') {
        to = location.pathname + to;
      }

      const idx = to.indexOf('?');
      const idx2 = to.indexOf('#');
      let pathname = ~idx
        ? to.substring(0, idx)
        : ~idx2
        ? to.substring(0, idx2)
        : to;
      let search = ~idx ? to.substring(idx, ~idx2 ? idx2 : undefined) : '';
      let hash = ~idx2 ? to.substring(idx2) : location.hash;

      if (!pathname) {
        pathname = location.pathname;
      } else if (pathname[0] != '/' && !/^https?\:\/\//.test(pathname)) {
        let relativeBase = location.pathname;
        const paths = relativeBase.split('/');
        paths.pop();
        let m;
        while ((m = /^\.\.?\//.exec(pathname))) {
          if (m[0] === '../') {
            paths.pop();
          }
          pathname = pathname.substring(m[0].length);
        }
        pathname = paths.concat(pathname).join('/');
      }

      return pathname + search + hash;
    }

    function isCurrentUrl(to, ctx) {
      if (!to) {
        return false;
      }
      const pathname = history.location.pathname;
      const link = normalizeLink(to, {
        ...location,
        pathname,
        hash: ''
      });

      if (!~link.indexOf('http') && ~link.indexOf(':')) {
        let strict = ctx && ctx.strict;
        return match(link, {
          decode: decodeURIComponent,
          strict: typeof strict !== 'undefined' ? strict : true
        })(pathname);
      }

      return decodeURI(pathname) === link;
    }

    let amisInstance = amis.embed(
      '#root',
      app,
      {
        location: history.location
      },
      {
        //fetcher:myfetch
        requestAdaptor:myRequestAdaptor,
        // watchRouteChange: fn => {
        //   return history.listen(fn);
        // },
        updateLocation: (location, replace) => {
          location = normalizeLink(location);
          if (location === 'goBack') {
            return history.goBack();
          } else if (
            (!/^https?\:\/\//.test(location) &&
              location ===
                history.location.pathname + history.location.search) ||
            location === history.location.href
          ) {
            // 目标地址和当前地址一样，不处理，免得重复刷新
            return;
          } else if (/^https?\:\/\//.test(location) || !history) {
            return (window.location.href = location);
          }

          history[replace ? 'replace' : 'push'](location);
        },
        jumpTo: (to, action) => {
          if (to === 'goBack') {
            return history.goBack();
          }

          to = normalizeLink(to);

          if (isCurrentUrl(to)) {
            return;
          }

          if (action && action.actionType === 'url') {
            action.blank === false
              ? (window.location.href = to)
              : window.open(to, '_blank');
            return;
          } else if (action && action.blank) {
            window.open(to, '_blank');
            return;
          }

          if (/^https?:\/\//.test(to)) {
            window.location.href = to;
          } else if (
            (!/^https?\:\/\//.test(to) &&
              to === history.pathname + history.location.search) ||
            to === history.location.href
          ) {
            // do nothing
          } else {
            history.push(to);
          }
        },
        isCurrentUrl: isCurrentUrl,
        theme: 'cxd'
      }
    );

    history.listen(state => {
      amisInstance.updateProps({
        location: state.location || state
      });
    });

};
function app() {
    if (localStorage.getItem("refresh_token")==null || localStorage.getItem("access_token")==null){
        window.location.href="/login"
        return;
    };
    usecss("amis@1.9.1-beta.26/sdk/sdk.css");
    usecss("amis@1.9.1-beta.26/sdk/helper.css");
    
    usejs("amis@1.9.1-beta.26/sdk/sdk.js") ;
    usejs("vue@2.7.8/dist/vue.js") ;
    usejs("history@4.10.1/umd/history.js") ;

    document.write('<link rel="stylesheet" href="/app/app.css">');
    document.write('<div id="root" class="app-wrapper"></div>');

    window.onload=ready
  };
function usejs(name){
    var jssrc="https://s1.ledotec.cn/webfront/cdn/npm/";
    document.write('<script src="'+jssrc+name+'"></script>');
};
function usecss(name){
    var csssrc="https://s1.ledotec.cn/webfront/cdn/npm/";
    document.write('<link rel="stylesheet" href="'+csssrc+name+'">');
};
function myRequestAdaptor(api) {
  var final_access_token=localStorage.getItem('access_token');
  if (Math.round(new Date().getTime()/1000)>Number(localStorage.getItem('access_token_express')) && g_isRefreshingAK==false && apiErrorCounter<3){
    g_isRefreshingAK=true;//锁定为正在刷新，避免二刷
    const request = new XMLHttpRequest();
    request.open('POST', myapihost+'/v2/auth/tokenexchange', false);
    request.send(JSON.stringify(
      {"refresh_token":localStorage.getItem('refresh_token')}
    ));
    res=JSON.parse(request.responseText)
    g_isRefreshingAK=false;//释放锁
    if (res.code!="Success"){
        //刷新失败，跳到登录页让用户重新登录
        //先清空令牌，防止登录页跳转死循环
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('access_token_express');
        //跳登录页
        window.location.href='/login';
        return;
    };
    //成功，保存新AK和过期时间
    localStorage.setItem('access_token',res.data.access_token);
    localStorage.setItem('access_token_express',String(Number(res.data.access_token_ttl)+Math.round(new Date().getTime()/1000)-5000));
    final_access_token=res.data.access_token;
  };
  return{
    ...api,
    headers:{
      ...api.headers,
      Authorization:'Bearer '+final_access_token
    }
  }
};
app();