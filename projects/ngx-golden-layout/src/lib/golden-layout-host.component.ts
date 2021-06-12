import {
  ApplicationRef,
  Component,
  ComponentRef,
  ElementRef,
  EmbeddedViewRef,
  OnDestroy,
} from "@angular/core";
import {
  ComponentContainer,
  GoldenLayout,
  ResolvedComponentItemConfig,
} from "golden-layout";
import { BaseComponentDirective } from "./base-component.directive";
import { GoldenLayoutComponentService } from "./golden-layout-component.service";

@Component({
  selector: "golden-layout-host",
  template: "",
  styles: [
    `
    :host {
      height: 100%;
      width: 100%;
      padding: 0;
    }
    `,
  ],
})
export class GoldenLayoutHostComponent implements OnDestroy {
  private _goldenLayout: GoldenLayout;
  private _containerMap = new Map<
    ComponentContainer,
    ComponentRef<BaseComponentDirective>
  >();

  get goldenLayout() {
    return this._goldenLayout;
  }

  constructor(
    private _elRef: ElementRef<HTMLElement>,
    private appRef: ApplicationRef,
    private goldenLayoutComponentService: GoldenLayoutComponentService
  ) {
    this._goldenLayout = new GoldenLayout(this._elRef.nativeElement);
    this._goldenLayout.getComponentEvent = (container, itemConfig) =>
      this.handleGetComponentEvent(container, itemConfig);
    this._goldenLayout.releaseComponentEvent = (container) =>
      this.handleReleaseComponentEvent(container);
  }

  ngOnDestroy() {
    this._goldenLayout.destroy();
  }

  setSize(width: number, height: number) {
    this._goldenLayout.setSize(width, height);
  }

  getComponentRef(container: ComponentContainer) {
    return this._containerMap.get(container);
  }

  private handleGetComponentEvent(
    container: ComponentContainer,
    itemConfig: ResolvedComponentItemConfig
  ) {
    const componentType = itemConfig.componentType;
    const componentRef = this.goldenLayoutComponentService.createComponent(
      componentType,
      container
    );

    this.appRef.attachView(componentRef.hostView);

    const domElem = (componentRef.hostView as EmbeddedViewRef<unknown>)
      .rootNodes[0] as HTMLElement;
    container.element.appendChild(domElem);

    this._containerMap.set(container, componentRef);

    return componentRef.instance;
  }

  private handleReleaseComponentEvent(container: ComponentContainer) {
    const componentRef = this._containerMap.get(container);
    if (componentRef === undefined) {
      throw new Error("Could not release component. Container not found");
    } else {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
      this._containerMap.delete(container);
    }
  }
}
