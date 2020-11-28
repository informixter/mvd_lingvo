# Лингвопроцессор
Кроссплатформенное программное обеспечение на основе [Electron Forge](https://www.electronforge.io/) для работы с текстом. 
Основная функциональность реализована в виде модулей(преобразователей) написанных на JavaScript, что позволяет легко расширять функциональность основного приложения.
Приложение может работать автономно, без подключения к интернету, но для демонстрации был добавлен модуль взаимодествия с сервисами Yandex для проверки орфографии.
Для удобства и повышения эффективности работы с текстом можно настроить горячие клавиши, которые будут доступны в любом текстовом редакторе. Если есть необходимость проверить работу, то в приложении встроен "подробный анализ текста".

![Lingvo Processor](img/main.jpg) 

## Скриншоты
[Windows 7](img/windows7.jpg) | [Debian 9](img/debian.jpg)
  
## Готовые приложения
Ссылки на уже собранные приложения. 

| Операционная система | Версия системы |  Ссылка |
| ------ | ------ | ------ |
| Windows | 7, 8, 10 | [lingvoprocessor-win64.msi](https://cdn.dataswarm.ru/lingvoprocessor-win64.msi) |
| Denian | 9+ | [lingvoprocessor-debian.deb](https://cdn.dataswarm.ru/lingvoprocessor-debian.deb) |
| MacOs | 10.14+ | [lingvoprocessor-mac.zip](https://cdn.dataswarm.ru/lingvoprocessor-mac.zip) |

## Сборка приложений в режимe "очумелые ручки"
Обратите внимание, что сборка приложений самостоятельно предполагает, что вы понимаете технические аспекты сборки ПО.
### Windows 7, 8, 10
##### Подготовка 
[NodeJS 12](https://nodejs.org/en/download/releases/) и 
[Visual C++ build tools](https://visualstudio.microsoft.com/ru/thank-you-downloading-visual-studio/?sku=BuildTools) или [Visual Studio 2017 Community (Desktop development with C++)](https://visualstudio.microsoft.com/pl/thank-you-downloading-visual-studio/?sku=Community).
Ставим [Git](https://git-scm.com/download/win).
Далее установите [WiX toolset](https://wixtoolset.org/releases/) и добавьте в PATH через `панель управления` и `редактирование окружающей` среды, путь(добавить bin) до каталога установленной прогараммы.
##### Сбор
Открываем CMD(в режиме администратора) и переходим в папку со скаченными исходниками средствами cmd. Далее в папку `app/angular-app` и ставим зависимости
```shell script
npm i
```
Далее собираем angular
```shell script
npm run build 
```  
Поднимаемся на директорию выше и выполняем установку зависимостей для электрона
```shell script
npm i
```
И делаем сборку проекта
```shell script
npm run make
```
Создается папка dist в которой будет лежать инсталлятор приложения.

### Debian 9+
Для запуска системы требуется Docker и make
```shell script
make build build_linux
``` 
После этого будет создана папка `deb` в которой будет лежать файл `release.deb`. 
Переносим файл в систему и через терминал устанавливаем пакет.
```shell script
dpkg -i release.deb
```