var app = getApp()


Page({
  data: {
    foodlist: [],
    overlist: [],
    isLogin: false,
    loginErrorMessage: '',
    isLoading: true
  },


  onLoad: function() {
    this.checkLoginStatus()
  },


  // 改进的登录状态检查方法
  checkLoginStatus: function() {
    wx.showLoading({
      title: '检查登录状态',
    })


    this.setData({ isLoading: true })


    // 优先检查全局登录状态
    if (app.globalData.isLogin && app.globalData.cusid) {
      this.setData({ 
        isLogin: true,
        isLoading: false 
      })
      this.fetchOrders()
      wx.hideLoading()
      return
    }


    // 尝试恢复登录状态
    const loginState = wx.getStorageSync('loginState')
    const userInfo = wx.getStorageSync('userInfo')
    const openid = wx.getStorageSync('openid')
    const loginTimestamp = wx.getStorageSync('loginTimestamp')
    const cusid = wx.getStorageSync('cusid')


    // 检查登录是否过期(7天内有效)
    const isLoginValid = loginTimestamp && 
      (Date.now() - loginTimestamp < 7 * 24 * 60 * 60 * 1000)


    if (loginState && userInfo && openid && isLoginValid && cusid) {
      // 恢复全局登录状态
      app.globalData.isLogin = true
      app.globalData.userInfo = userInfo
      app.globalData.openid = openid
      app.globalData.cusid = cusid


      this.setData({
        isLogin: true,
        loginErrorMessage: '',
        isLoading: false
      })


      this.fetchOrders()
      wx.hideLoading()
    } else {
      // 未登录或登录过期
      this.setData({
        isLogin: false,
        foodlist: [],
        overlist: [],
        loginErrorMessage: '登录已过期，请重新登录',
        isLoading: false
      })


      wx.hideLoading()
      this.redirectToLogin()
    }
  },


  // 时间格式化方法
  formatTime: function(timeString) {
    if (!timeString) return ''
    
    let date = new Date(timeString)
    
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  },


  // 获取订单方法
  fetchOrders: function() {
    if (!app.globalData.cusid) {
      this.redirectToLogin()
      return
    }


    wx.request({
      url: app.globalData.serveraddr + '/order/getOrders',
      data: { 
        cusid: app.globalData.cusid 
      },
      success: res => {
        // 处理进行中的订单
        let foodlist = res.data.order ? res.data.order.map((order, index) => ({
          orderid: order.ORDERID,
          orderPrice: order.ORDERTOTLEPRICE,
          orderState: order.ORDERSTATE,
          orderSort: index + 1,
          foods: order.foods ? order.foods.split(',') : [],
          createTime: this.formatTime(order.ORDERTIME) || '',
          totalPrice: order.ORDERTOTLEPRICE || 0,
          orderType: 'current'
        })) : []


        // 处理已完成订单
        let overlist = res.data.overOrder ? res.data.overOrder.map(order => ({
          ORDERID: order.ORDERID,
          ORDERTOTLEPRICE: order.ORDERTOTLEPRICE,
          orderType: 'over',
          CREATEDAT: this.formatTime(order.ORDERTIME),
          foods: order.foods ? order.foods.split(',') : [],
          COMPLETEDAT: this.formatTime(order.COMPLETEDAT || order.ORDERTIME)
        })) : []


        this.setData({
          foodlist: foodlist,
          overlist: overlist
        })
      },
      fail: err => {
        console.error('获取订单失败', err)
        wx.showToast({
          title: '获取订单失败',
          icon: 'none'
        })
        this.redirectToLogin()
      }
    })
  },


  // 重定向到登录页面
  redirectToLogin: function() {
    wx.showModal({
      title: '登录提示',
      content: '您还未登录或登录已过期,是否前往登录?',
      success: (res) => {
        if (res.confirm) {
          wx.redirectTo({
            url: '/pages/login/login'
          })
        } else {
          wx.navigateBack({
            delta: 1
          })
        }
      }
    })
  },


  // 页面显示时重新检查登录状态
  onShow: function() {
    this.checkLoginStatus()
  },


  // 下拉刷新
  onPullDownRefresh: function() {
    this.checkLoginStatus()
    wx.stopPullDownRefresh()
  },


  // 再来一单
  agin: function() {
    wx.redirectTo({
      url: '../menu/menu'
    })
  },


  // 退出登录
  logout: function() {
    // 调用全局退出登录方法
    app.logout()


    // 清除页面状态
    this.setData({
      isLogin: false,
      foodlist: [],
      overlist: [],
      loginErrorMessage: '已退出登录'
    })


    // 跳转到登录页
    wx.redirectTo({
      url: '/pages/login/login'
    })
  }
})