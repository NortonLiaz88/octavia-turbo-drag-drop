# react-native-turbo-drag-drop

a react-native implementation of drag and drop

## Installation

```sh
npm install react-native-turbo-drag-drop
```

## Usage


```js
import { multiply } from 'react-native-turbo-drag-drop';

// ...

const result = multiply(3, 7);
```


## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)


Finally out of all of the github issues / stack overflow posts THIS was the solution - thanks @thomashagstrom!

To summarise for future devs / future me...

Close Android Studio
Run ./gradlew --stop to stop any running gradle daemons
If you're using nvm to manage your node versions, run nvm use to ensure your shell is using the right version
Run open -a /Applications/Android\ Studio.app (if you're using the version installed via JetBrains Toolbox, change the path accordingly)
Invalidate caches & restart Android Studio
Run the app - you should see no node errors 🎉