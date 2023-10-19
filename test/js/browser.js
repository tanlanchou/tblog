const browserList = [
  {
    bs_name: "火狐浏览器",
    bs_tag: "firefox",
  },
  {
    bs_name: "edge浏览器",
    bs_tag: "edg",
  },
  {
    bs_name: "opera",
    bs_tag: "opr",
  },
  {
    bs_name: "世界之窗",
    bs_tag: "theworld",
  },
  {
    bs_name: "遨游",
    bs_tag: "maxthon",
  },
  {
    bs_name: "QQ浏览器",
    bs_tag: "qqbrowser",
  },
  {
    bs_name: "360浏览器",
    bs_tag: "360",
  },
  {
    bs_name: "搜狗浏览器",
    bs_tag: "metasr",
  },
  {
    bs_name: "uc浏览器",
    bs_tag: "ubrowse",
  },
  {
    bs_name: "猎豹",
    bs_tag: "lbbrowser",
  },
  {
    bs_name: "微信浏览器",
    bs_tag: "micromessenger",
  },
  {
    bs_name: "小米浏览器",
    bs_tag: "miuibrowser",
  },
  {
    bs_name: "百度浏览器",
    bs_tag: "baidu",
  },
  {
    bs_name: "2345浏览器",
    bs_tag: "2345explorer",
  },
  {
    bs_name: "IE浏览器",
    bs_tag: "msie",
  },
  {
    bs_name: "IE11浏览器",
    bs_tag: "rv:11.0",
  },
];
const userAgent = navigator.userAgent.toLowerCase();
const userAgentData = navigator.userAgentData || { brands: [] };

// 通过浏览器标识获取浏览器版本号
const getBsVersion = (tag) => {
  const browser = userAgent
    .split(" ")
    .find((item) => item.indexOf(tag) > -1)
    .split("/");
  return browser[1] || getBsVersion("chrome");
};

// 判断是否是遨游浏览器
const isMaxthon = () => {
  return window.maxthon;
};

// 判断是否是360浏览器，简单通过浏览器信息无法判断
const is360 = () => {
  const result = false;
  for (var key in navigator.plugins) {
    if (navigator.plugins[key].filename == "internal-nacl-plugin") {
      return !result;
    }
  }
  return result;
};

// 获取浏览器信息
const getBsInfo = (list = []) => {
  if (isMaxthon()) {
    return {
      bs_name: "遨游浏览器",
      bs_tag: "maxthon",
      bs_version: getBsVersion("chrome"),
    };
  }
  if (userAgentData.brands.some((item) => item.brand === "Google Chrome")) {
    return {
      bs_name: "chrome浏览器",
      bs_tag: "chrome",
      bs_version: getBsVersion("chrome"),
    };
  }
  if (userAgent.indexOf("safari") > -1 && userAgent.indexOf("chrome") === -1) {
    return {
      bs_name: "safari浏览器",
      bs_tag: "safari",
      bs_version: getBsVersion("safari"),
    };
  }
  const isBrowser = browserList
    .concat(list)
    .find((item) => userAgent.indexOf(item.bs_tag) > -1);
  if (isBrowser) {
    return {
      bs_name: isBrowser.bs_name,
      bs_tag: isBrowser.bs_tag,
      bs_version: getBsVersion(isBrowser.bs_tag),
    };
  } else {
    if (is360()) {
      return {
        bs_name: "360浏览器",
        bs_tag: "360",
        bs_version: getBsVersion("chrome"),
      };
    }
    return {
      bs_name: "未知浏览器",
      bs_tag: "other",
      bs_version: "",
    };
  }
};

function getOS() {
  var u = navigator.userAgent;
  if (!!u.match(/compatible/i) || u.match(/Windows/i)) {
    return "windows";
  } else if (!!u.match(/Macintosh/i) || u.match(/MacIntel/i)) {
    return "macOS";
  } else if (!!u.match(/iphone/i) || u.match(/Ipad/i)) {
    return "ios";
  } else if (!!u.match(/android/i)) {
    return "android";
  } else {
    return "other";
  }
}
