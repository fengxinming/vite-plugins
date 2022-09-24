import React from 'react';

export default {
  fixedTop: false, // 默认为true是定位方式fixed。由于demo不属于整个页面，所以该属性为false，以absolute;作为定位方式
  home: {
    img: 'https://img.alicdn.com/tfs/TB1Cti8pGNj0u4jSZFyXXXgMVXa-210-100.png',
    homeUrl: '//home.console.aliyun.com'
  },
  sliderOfferWidth: 495, // 由于demo不属于整个页面，所以用该属性sliderOfferWidth控制顶层侧弹窗masker的width大小
  sliderContext: <div>silder DIY area</div>,
  input: {
    onChange: (e) => console.log(e),
    onSearch: (e) => console.log('onSearch', e),
    popupConext: <div>Input DIY area</div>
  },
  nav: [
    {
      text: 'test1',
      onClick: () => console.log('navClick'),
      onItemClick: (key, item, e) => console.log('onItemClick', key, item, e),
      menus: [
        { key: '1', label: '测试1' },
        { key: '2', label: '测试2' },
        { key: '231', type: 'divider' },
        { key: '23', label: '测试23' }
      ]
    },
    {
      text: 'test2',
      menus: [
        { key: '11', label: '测试1' },
        { key: '21', label: '测试2' },
        { key: '231', label: '测试23' }
      ]
    },
    {
      render: <div>111</div>
    }
  ],
  icons: [
    { type: 'cry', onClick: () => console.log('navClick') },
    { type: 'atm', popupConext: <div style={{ width: 500 }}>DIY area</div> }
  ],
  user: {
    icon: 'https://img.alicdn.com/tfs/TB1NIZ7X6MZ7e4jSZFOXXX7epXa-128-129.png',
    onClick: () => console.log('userInfo'),
    popupConext: <div>DIY area</div>
  }
};
