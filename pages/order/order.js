// pages/order/order.js
var app = getApp()


Page({
  /**
   * 页面的初始数据
   */
  data: {
    foodlist: [],
    overlist: [],
    isLogin: false
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function() {
    this.checkLoginStatus()
  },


  /**
   * 检查登录状态
   */
  checkLoginStatus: function() {
    // 首先检查全局数据
    if (app.globalData.isLogin && app.globalData.cusid) {
      this.setData({
        isLogin: true
      })
      this.fetchOrders()
      return
    }


    // 从本地存储获取登录信息
    const loginState = wx.getStorageSync('loginState')
    const userInfo = wx.getStorageSync('userInfo')
    const openid = wx.getStorageSync('openid')
    const loginTimestamp = wx.getStorageSync('loginTimestamp')
    const cusid = wx.getStorageSync('cusid')


    // 检查登录是否过期(例如7天内有效)
    const isLoginValid = loginTimestamp && 
      (Date.now() - loginTimestamp < 7 * 24 * 60 * 60 * 1000)


    // 详细的登录状态验证
    if (loginState && userInfo && openid && isLoginValid && cusid) {
      // 更新全局数据
      app.globalData.isLogin = true
      app.globalData.userInfo = userInfo
      app.globalData.openid = openid
      app.globalData.cusid = cusid


      // 设置本地登录状态
      this.setData({
        isLogin: true
      })


      // 获取订单
      this.fetchOrders()
    } else {
      // 未登录或登录过期
      this.setData({
        isLogin: false
      })


      // 引导用户登录
      this.redirectToLogin()
    }
  },

// 新增时间格式化方法
formatTime: function(timeString) {
  if (!timeString) return '';
  
  // 创建日期对象
  let date = new Date(timeString);
  
  // 格式化日期
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
},

  /**
   * 获取订单
   */
  fetchOrders: function() {
    wx.request({
      url: app.globalData.serveraddr + '/order/getOrders',
      data: {
        cusid: app.globalData.cusid
      },
      success: res => {
        console.log('订单完整响应:', res.data);
      console.log('cusid:', app.globalData.cusid);
      // 检查响应数据中是否有overOrder
      if (!res.data.overOrder) {
        console.warn('响应中没有overOrder字段');
      }
  
  
        // 处理进行中的订单
        let foodlist = res.data.order || [];
      if (res.data.order && res.data.order.length > 0) {
        foodlist = res.data.order.map((order, index) => {
          return {
            orderid: order.ORDERID,
            orderPrice: order.ORDERTOTLEPRICE,
            orderTime: 30,
            orderState: order.ORDERSTATE,
            orderSort: index + 1,
            foods: order.foods ? order.foods.split(',') : [],
            createTime: this.formatTime(order.ORDERTIME) || '',
            totalPrice: order.ORDERTOTLEPRICE || 0,
            orderType: 'current'
          }
        });
      }
  
  
        // 处理已完成订单时增加更多日志和容错
        let overlist = [];
      if (res.data.overOrder && res.data.overOrder.length > 0) {
        overlist = res.data.overOrder.map(order => {
          console.log('单个已完成订单:', order);
          return {
            ORDERID: order.ORDERID,
            ORDERTOTLEPRICE: order.ORDERTOTLEPRICE,
            orderType: 'over',
            CREATEDAT: this.formatTime(order.ORDERTIME),
            foods: order.foods ? order.foods.split(',') : [],
            COMPLETEDAT: this.formatTime(order.COMPLETEDAT || order.ORDERTIME)
          }
        });
      } else {
        console.warn('没有已完成订单数据');
      }


      console.log('处理后的已完成订单:', overlist);
  
        // 更新页面数据
      this.setData({
        foodlist: foodlist,
        overlist: overlist
      });
    },
    fail: err => {
      console.error('获取订单失败', err);
      wx.showToast({
        title: '获取订单失败',
        icon: 'none'
        });
      }
    });
  },


  /**
   * 重定向到登录页面
   */
  redirectToLogin: function() {
    wx.showModal({
      title: '登录提示',
      content: '您还未登录，是否前往登录？',
      success: (res) => {
        if (res.confirm) {
          // 跳转到登录页面
          wx.redirectTo({
            url: '/pages/login/login' // 根据实际登录页面路径调整
          })
        } else {
          // 返回上一页
          wx.navigateBack({
            delta: 1
          })
        }
      }
    })
  },


  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 每次页面显示时重新检查登录状态
    this.checkLoginStatus()
  },


  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    // 下拉刷新
    this.checkLoginStatus()
    wx.stopPullDownRefresh()
  },


  // 再来一单
  agin: function() {
    wx.redirectTo({
      url: '../menu/menu',
    })
  },


  /**
   * 退出登录
   */
  logout: function() {
    // 清除本地存储
    wx.removeStorageSync('loginState')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('openid')
    wx.removeStorageSync('loginTimestamp')
    wx.removeStorageSync('cusid')


    // 更新全局数据
    app.globalData.isLogin = false
    app.globalData.userInfo = null
    app.globalData.openid = null
    app.globalData.cusid = null


    // 跳转到登录页
    wx.redirectTo({
      url: '/pages/login/login'
    })
  }
})