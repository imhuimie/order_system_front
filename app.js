App({
  globalData: {
    userInfo: null,
    openid: null,
    appid: null,
    serveraddr: 'https://wx.544444.xyz', 
    isLogin: false,
    isAdmin: false,
    cusid: null,
    isHaveOrder: false,
    limit: false,
    loginTimestamp: null  // 新增登录时间戳
  },


  onLaunch: function () {
    var that = this
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    
    var accountInfo = wx.getAccountInfoSync();
    this.globalData.appid = accountInfo.miniProgram.appId


    // 检查登录状态和有效期
    this.checkLoginState()
  },


  // 新增登录状态检查方法
  checkLoginState() {
    const loginState = wx.getStorageSync('loginState')
    const userInfo = wx.getStorageSync('userInfo')
    const openid = wx.getStorageSync('openid')
    const loginTimestamp = wx.getStorageSync('loginTimestamp')
    const isAdmin = wx.getStorageSync('isAdmin')


    // 检查登录是否过期(例如7天内有效)
    const isLoginValid = loginTimestamp && 
      (Date.now() - loginTimestamp < 7 * 24 * 60 * 60 * 1000)


    if (loginState && userInfo && openid && isLoginValid) {
      this.globalData.isLogin = true
      this.globalData.userInfo = userInfo
      this.globalData.openid = openid
      this.globalData.loginTimestamp = loginTimestamp
      this.globalData.isAdmin = isAdmin || false
    } else {
      this.globalData.isLogin = false
      // 清除过期的登录信息
      wx.removeStorageSync('loginState')
      wx.removeStorageSync('userInfo')
      wx.removeStorageSync('openid')
      wx.removeStorageSync('loginTimestamp')
      wx.removeStorageSync('isAdmin')
    }
  },


  // 修改登录方法，增加持久化和时间戳
  loginWithUserProfile() {
    return new Promise((resolve, reject) => {
      if (!this.globalData.userInfo) {
        reject(new Error('未获取用户信息'));
        return;
      }
      
      this.getOpenId()
        .then(res => {
          // 保存登录状态和时间戳
          const timestamp = Date.now()
          wx.setStorageSync('loginState', true);
          wx.setStorageSync('userInfo', this.globalData.userInfo);
          wx.setStorageSync('openid', this.globalData.openid);
          wx.setStorageSync('loginTimestamp', timestamp);
          wx.setStorageSync('isAdmin', this.globalData.isAdmin);


          this.globalData.loginTimestamp = timestamp
          resolve(res);
        })
        .catch(reject);
    });
  },


  // 退出登录方法保持不变
  logout() {
    this.globalData.userInfo = null
    this.globalData.openid = null
    this.globalData.isLogin = false
    this.globalData.isAdmin = false
    this.globalData.cusid = null
    this.globalData.isHaveOrder = false
    this.globalData.limit = false
    this.globalData.loginTimestamp = null


    // 清除本地存储
    wx.removeStorageSync('loginState')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('openid')
    wx.removeStorageSync('loginTimestamp')
    wx.removeStorageSync('isAdmin')
  },


  // 获取 OpenID 和登录
  getOpenId: function () {
    var that = this
    return new Promise(function(resolve, reject) {
      wx.login({
        success: res => {
          console.log('wx.login 成功,code:', res.code);


          // 检查是否已获取用户信息
          if (!that.globalData.userInfo) {
            wx.showModal({
              title: '获取用户信息失败',
              content: '请先授权获取用户信息',
              showCancel: false
            });
            return reject(new Error('未获取用户信息'));
          }


          wx.request({
            url: that.globalData.serveraddr + '/customer/getopenid',
            method: 'GET',
            data: {
              code: res.code,
              appid: that.globalData.appid
            },
            timeout: 10000,
            success: res => {
              console.log('GetOpenID 完整响应:', res);


              if (res.statusCode === 200 && res.data.openid) {
                that.globalData.openid = res.data.openid;
                
                console.log('用户信息详情:', {
                  nickname: that.globalData.userInfo.nickName,
                  avatarUrl: that.globalData.userInfo.avatarUrl
                });


                wx.request({
                  url: that.globalData.serveraddr + '/customer/login',
                  method: 'POST',
                  data: {
                    nickname: that.globalData.userInfo.nickName,
                    avatarUrl: that.globalData.userInfo.avatarUrl,
                    openid: that.globalData.openid,
                    userInfo: {
                      nickName: that.globalData.userInfo.nickName,
                      avatarUrl: that.globalData.userInfo.avatarUrl,
                      gender: that.globalData.userInfo.gender,
                      country: that.globalData.userInfo.country,
                      province: that.globalData.userInfo.province,
                      city: that.globalData.userInfo.city
                    }
                  },
                  header: {
                    'content-type': 'application/json'
                  },
                  success: r => {
                    console.log('Login 完整响应:', r);
                    
                    console.log('登录响应详情:', {
                      statusCode: r.statusCode,
                      data: r.data
                    });
                    
                    if (r.data && r.data.code === 200) {
                      that.globalData.isLogin = true;
                      that.globalData.cusid = r.data.cusid;
                      that.globalData.isAdmin = r.data.isAdmin || false;
                      that.globalData.isHaveOrder = r.data.isHaveOrder || false;


                      resolve(that.globalData);
                    } else {
                      console.error('登录失败:', r.data);
                      wx.showModal({
                        title: '登录失败',
                        content: r.data.msg || '未知错误',
                        showCancel: false
                      });
                      reject(new Error(r.data.msg || '登录失败'));
                    }
                  },
                  fail: err => {
                    console.error('登录请求失败:', err);
                    reject(err);
                  }
                });
              } else {
                reject(new Error('获取OpenID失败'));
              }
            },
            fail: err => {
              console.error('获取OpenID请求失败:', err);
              reject(err);
            }
          });
        }
      });
    });
  }
})