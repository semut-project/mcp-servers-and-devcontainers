import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';
import { spfi, SPFx } from '@pnp/sp';
import { graphfi, SPFx as GraphSPFx } from '@pnp/graph';

import * as strings from 'DocumentManagementWebPartStrings';
import DocumentManagement from './components/DocumentManagement';
import { IDocumentManagementProps } from './components/IDocumentManagementProps';
import { FluentThemeProvider } from './components/FluentThemeProvider';

export interface IDocumentManagementWebPartProps {
  description: string;
}

export default class DocumentManagementWebPart extends BaseClientSideWebPart<IDocumentManagementWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public override render(): void {
    const element: React.ReactElement = React.createElement(
      FluentThemeProvider,
      {
        initialTheme: this._isDarkTheme,
        children: React.createElement(
          DocumentManagement,
          {
            description: this.properties.description,
            isDarkTheme: this._isDarkTheme,
            environmentMessage: this._environmentMessage,
            hasTeamsContext: !!this.context.sdks.microsoftTeams,
            userDisplayName: this.context.pageContext.user.displayName,
            context: this.context
          }
        )
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected override onInit(): Promise<void> {
    // Initialize PnPjs with SPFx context
    this.initializePnPjs();
    
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
  }

  /**
   * Initialize PnPjs with SPFx context for SharePoint and Graph operations
   */
  private initializePnPjs(): void {
    try {
      // Initialize SharePoint PnP
      const sp = spfi().using(SPFx(this.context));
      
      // Initialize Graph PnP
      const graph = graphfi().using(GraphSPFx(this.context));
      
      // Make available globally or store in context if needed
      (window as any).pnp = { sp, graph };
      
      console.log('PnPjs initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize PnPjs:', error);
      throw new Error(`PnPjs initialization failed: ${error.message}`);
    }
  }



  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected override onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected override onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected override get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected override getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
