// pages/severaddfood/severaddfood.js
var app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    foodinfo: {},
    typeinfo: {
      "gtid": "1",
      "gtname": "主食",
    },
    radioItems: [{
      name: '主食',
      value: '0'
    },
    {
      name: '水果',
      value: '1',
    },
    {
      name: '甜点',
      value: '2',
    }
    ],
    files: [],
    newtypename: null,
    moreflag: false,
    showTopTips: false,
    warning: "",
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var radioItems = []
    wx.request({
      url: app.globalData.serveraddr + '/foodadmin/getGoodType',
      success: res => {
        if (res.data && res.data.goodstypes) {
          for (let i = 0; i < res.data.goodstypes.length; i++) {
            var items = {}
            items.name = res.data.goodstypes[i].GTNAME
            items.value = res.data.goodstypes[i].GTID - 1
            if (res.data.goodstypes[i].GTID == 1) {
              items.checked = true
            } else {
              items.checked = false
            }
            radioItems.push(items)
          }
          this.setData({
            radioItems: radioItems
          })
        }
      },
      fail: err => {
        console.error('获取菜品类型失败', err)
      }
    })
  },


  // 单选框变更
  radioChange: function (e) {
    var radioItems = this.data.radioItems;
    for (var i = 0, len = radioItems.length; i < len; ++i) {
      radioItems[i].checked = radioItems[i].value == e.detail.value;
    }
    this.setData({
      radioItems: radioItems
    });
  },


  // 添加更多菜品类型
  addmore: function () {
    this.setData({
      moreflag: true
    });
  },


  // 提交新的菜品类型
  submitmore: function (e) {
    this.setData({
      newtypename: e.detail.value.typename
    });


    wx.request({
      url: app.globalData.serveraddr + '/foodadmin/addGoodType',
      data: {
        newtypename: e.detail.value.typename,
        gtid: this.data.radioItems.length + 1
      },
      success: res => {
        console.log(res)
      }
    })


    var newtype = {
      name: "",
      value: '',
      checked: true
    };


    newtype.value = this.data.radioItems.length.toString();
    this.data.typeinfo.gtid = this.data.radioItems.length.toString();
    newtype.name = this.data.newtypename;
    this.data.typeinfo.gtname = this.data.newtypename;


    for (var i = 0; i < this.data.radioItems.length; i++) {
      this.data.radioItems[i].checked = false;
    }


    this.data.radioItems.push(newtype);
    this.setData({
      radioItems: this.data.radioItems,
      moreflag: false,
      typeinfo: this.data.typeinfo,
    });
  },


  // 选择图片
  chooseImage: function (e) {
    wx.chooseImage({
      sizeType: ['original', 'compressed'], 
      sourceType: ['album', 'camera'], 
      success: (res) => {
        // 上传图片到服务器
        this.uploadImage(res.tempFilePaths[0]);
      }
    });
  },


  // 上传图片到服务器
uploadImage: function (filePath) {
  wx.uploadFile({
    url: `${app.globalData.serveraddr}/foodadmin/addGoodsImg`,
    filePath: filePath,
    name: 'fileImg',
    success: (uploadRes) => {
      console.log('上传响应原始数据:', uploadRes.data);
      
      // 安全地解析响应
      try {
        // 尝试解析 JSON
        const result = typeof uploadRes.data === 'string' 
          ? JSON.parse(uploadRes.data) 
          : uploadRes.data;
        
        console.log('解析后的结果:', result);
        
        if (result.imageUrl) {
          // 替换 localhost 为服务器公网地址
          const imageUrl = result.imageUrl.replace('https://wx.544444.xyz', app.globalData.serveraddr);
          
          this.setData({
            files: [imageUrl]
          });
        } else {
          console.error('未找到图片URL', result);
        }
      } catch (error) {
        console.error('解析上传响应失败', error);
        wx.showToast({
          title: '图片上传失败',
          icon: 'none'
        });
      }
    },
    fail: (err) => {
      console.error('图片上传失败', err);
      wx.showToast({
        title: '图片上传失败',
        icon: 'none'
      });
    }
  });
},


  // 提交表单
  submit: function (e) {
    var that = this
    
    var warningflag = false;
    console.log(e.detail.value.foodname);
    
    // 重置 foodinfo
    this.data.foodinfo = {};
    
    // 表单验证
    if (e.detail.value.foodname == '') {
      this.setData({
        warning: "请输入菜品名称",
      })
      warningflag = true;
    } else {
      this.data.foodinfo.gname = e.detail.value.foodname;
      
      if (e.detail.value.foodprice == '') {
        this.setData({
          warning: "请输入价格",
        })
        warningflag = true;
      } else {
        this.data.foodinfo.gprice = e.detail.value.foodprice;
        this.data.foodinfo.goprice = e.detail.value.foodprice;
        
        if (e.detail.value.foodtime == '') {
          this.setData({
            warning: "请输入供应时段",
          })
          warningflag = true;
        } else {
          this.data.foodinfo.gcontent = e.detail.value.foodtime;
          
          if (e.detail.value.fooddiscribe == '') {
            this.setData({
              warning: "请输入菜品描述",
            })
            warningflag = true;
          } else {
            this.data.foodinfo.ginfo = e.detail.value.fooddiscribe;
            
            if (this.data.files.length === 0) {
              this.setData({
                warning: "请添加图片",
              })
              warningflag = true;
            } else {
              // 提取文件名
              this.data.foodinfo.gimg = this.data.files[0].split('/').pop();
              
              // 选择菜品类型
              for (var i = 0; i < this.data.radioItems.length; i++) {
                if (this.data.radioItems[i].checked == true)
                  this.data.foodinfo.gtid = i + 1;
              }
            }
          }
        }
      }
    }
    
    // 处理错误提示
    if (warningflag) {
      this.setData({
        showTopTips: true
      });
      
      setTimeout(() => {
        this.setData({
          showTopTips: false
        });
      }, 3000);
      
      return;
    }
    
    // 发送菜品数据
    wx.request({
      url: app.globalData.serveraddr + '/foodadmin/addGoods',
      method: 'GET',
      data: {
        foodinfo: JSON.stringify(this.data.foodinfo)
      },
      success: (result) => {
        console.log('添加菜品响应:', result);
        
        if (result.data.result.code == 200) {
          wx.showToast({
            title: '提交成功',
            icon: 'success',
            duration: 1000
          });
          
          wx.reLaunch({
            url: '../severmenu/severmenu'
          });
        } else {
          wx.showToast({
            title: '提交失败',
            icon: 'none',
            duration: 1000
          });
        }
      },
      fail: (err) => {
        console.error('添加菜品失败', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none',
          duration: 1000
        });
      }
    });
  }
});