package com.turbodragdrop

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import java.util.Collections

class TurboDragDropPackage : ReactPackage {

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    // Registra o seu módulo aqui
    return listOf(
      TurboDragDropModule(reactContext)
    )
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    // Retorna uma lista vazia porque esta biblioteca não tem componentes de UI nativos (ViewManagers)
    return Collections.emptyList()
  }
}
