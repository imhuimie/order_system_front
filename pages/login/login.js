const app = getApp()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'


Page({
  data: {
    avatarUrl: defaultAvatarUrl,
    nickname: '',
    userInfo: {},
    hasUserInfo: false,
    isAdmin: false,
    loginTips: '检查登录状态...'
  },


  onLoad: function () {
    // 显示登录状态检查提示
    wx.showLoading({
      title: '检查登录状态',
    });


    // 检查是否已有全局用户信息
    if (app.globalData.userInfo) {
      this.updateUserInfoState(app.globalData.userInfo);
      wx.hideLoading();
      return;
    }


    // 检查本地存储的登录信息
    const loginState = wx.getStorageSync('loginState');
    const userInfo = wx.getStorageSync('userInfo');
    const loginTimestamp = wx.getStorageSync('loginTimestamp');
    const isAdmin = wx.getStorageSync('isAdmin');


    // 检查登录是否有效(7天内)
    const isLoginValid = loginTimestamp && 
      (Date.now() - loginTimestamp < 7 * 24 * 60 * 60 * 1000);


    if (loginState && userInfo && isLoginValid) {
      // 自动恢复登录状态
      app.globalData.userInfo = userInfo;
      app.globalData.isAdmin = isAdmin || false;
      this.updateUserInfoState(userInfo);
      wx.hideLoading();
    } else {
      // 未登录或登录已过期
      wx.hideLoading();
      this.setData({
        loginTips: '请重新登录',
        hasUserInfo: false
      });
    }
  },


  // 更新用户信息状态的统一方法
  updateUserInfoState(userInfo) {
    this.setData({
      userInfo: userInfo,
      hasUserInfo: true,
      isAdmin: app.globalData.isAdmin || false,
      avatarUrl: userInfo.avatarUrl || defaultAvatarUrl,
      nickname: userInfo.nickName || ''
    });
  },


  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail 
    this.setData({
      avatarUrl,
    })
  },


  // 输入昵称
  onInputNickname(e) {
    this.setData({
      nickname: e.detail.value
    })
  },


  // 登录方法
  doLogin() {
    // 检查是否填写完整
    if (!this.data.avatarUrl || !this.data.nickname) {
      wx.showToast({
        title: '请完善信息',
        icon: 'none'
      });
      return;
    }


    wx.showLoading({
      title: '正在登录',
    });


    // 构建用户信息
    const userInfo = {
      nickName: this.data.nickname,
      avatarUrl: this.data.avatarUrl
    };


    // 保存到全局
    app.globalData.userInfo = userInfo;


    // 调用登录流程
    app.loginWithUserProfile()
      .then(() => {
        wx.hideLoading();
        
        // 更新页面数据
        this.updateUserInfoState(app.globalData.userInfo);


        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });


        // 可选：跳转到主页或其他页面
        wx.reLaunch({
          url: '/pages/index/index'
        });
      })
      .catch((error) => {
        wx.hideLoading();
        console.error('登录失败', error);
        wx.showModal({
          title: '登录失败',
          content: error.message || '登录过程出现未知错误',
          showCancel: false
        });
      });
  },


  // 重新登录方法
  reLogin() {
    wx.showModal({
      title: '重新登录',
      content: '是否确认重新登录?',
      success: (res) => {
        if (res.confirm) {
          // 清除当前登录状态
          app.logout();
          
          // 重置页面状态
          this.setData({
            userInfo: {},
            hasUserInfo: false,
            isAdmin: false,
            avatarUrl: defaultAvatarUrl,
            nickname: ''
          });
        }
      }
    });
  },


  // 立即点餐 - 修改为直接跳转点餐界面
  toMenu: function () {
    // 检查是否已授权登录
    if (!this.data.hasUserInfo) {
      wx.showModal({
        title: '提示',
        content: '请先授权登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.doLogin()
          }
        }
      });
      return;
    }


    // 直接跳转到点餐页面
    wx.navigateTo({
      url: '../menu/menu'
    });
  },


  // 我的订单跳转方法
  toMyOrder: function() {
    // 检查是否已授权登录
    if (!this.data.hasUserInfo) {
      wx.showModal({
        title: '提示',
        content: '请先授权登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.doLogin()
          }
        }
      });
      return;
    }


    // 直接跳转到订单页面
    wx.navigateTo({
      url: '../order/order'
    });
  },


  // 管理员入口方法
  openadmin: function () {
    if (app.globalData.isAdmin) {
      wx.navigateTo({
        url: '../severmenu/severmenu'
      });
    } else {
      wx.showModal({
        title: '权限不足',
        content: '您没有管理员权限',
        showCancel: false
      });
    }
  },


  // 退出登录
  logout: function() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗?',
      success: (res) => {
        if (res.confirm) {
          // 调用全局退出登录方法
          app.logout();
          
          // 重置页面状态
          this.setData({
            userInfo: {},
            hasUserInfo: false,
            isAdmin: false,
            avatarUrl: defaultAvatarUrl,
            nickname: ''
          });


          // 返回到登录页
          wx.reLaunch({
            url: '/pages/login/login'
          });
        }
      }
    });
  }
})