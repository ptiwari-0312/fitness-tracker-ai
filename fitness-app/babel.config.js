module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@": "./src",
            "@components": "./src/components",
            "@hooks": "./src/hooks",
            "@services": "./src/services",
            "@store": "./src/store",
            "@theme": "./src/theme",
            "@assets": "./src/assets",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
